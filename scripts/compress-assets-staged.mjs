/**
 * Pre-commit: compress only staged image files and re-stage them.
 */
import sharp from 'sharp';
import { optimize } from 'svgo';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SKIP_FILES = ['favicon.png', 'icon.svg'];

function getStagedImages() {
  const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => /\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(f))
    .filter((f) => !SKIP_FILES.includes(path.basename(f)))
    .map((f) => path.resolve(ROOT, f));
}

async function compressPng(filePath) {
  const original = fs.readFileSync(filePath);
  const compressed = await sharp(original)
    .png({ quality: 80, compressionLevel: 9, effort: 10 })
    .toBuffer();
  if (compressed.length < original.length) {
    fs.writeFileSync(filePath, compressed);
    return true;
  }
  return false;
}

async function compressJpg(filePath) {
  const original = fs.readFileSync(filePath);
  const compressed = await sharp(original)
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  if (compressed.length < original.length) {
    fs.writeFileSync(filePath, compressed);
    return true;
  }
  return false;
}

function compressSvg(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const result = optimize(original, {
    multipass: true,
    plugins: [{ name: 'preset-default' }, { name: 'removeDimensions', active: false }],
  });
  if (Buffer.byteLength(result.data) < Buffer.byteLength(original)) {
    fs.writeFileSync(filePath, result.data);
    return true;
  }
  return false;
}

async function main() {
  const staged = getStagedImages();
  if (staged.length === 0) return;

  console.log(`[compress] ${staged.length} staged image(s) found, compressing...`);

  for (const filePath of staged) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    try {
      let saved = false;
      if (ext === '.png') saved = await compressPng(filePath);
      else if (ext === '.jpg' || ext === '.jpeg') saved = await compressJpg(filePath);
      else if (ext === '.svg') saved = compressSvg(filePath);

      if (saved) {
        execSync(`git add "${filePath}"`, { cwd: ROOT });
        console.log(`  ✓ ${basename} compressed and re-staged`);
      }
    } catch (err) {
      console.log(`  ✗ ${basename}: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error('[compress] Error:', err.message);
  process.exit(1);
});
