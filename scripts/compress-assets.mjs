import sharp from 'sharp';
import { optimize } from 'svgo';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ASSET_DIR = 'src/shared/assets';
const SKIP_FILES = ['favicon.png', 'icon.svg'];

function getAllFiles(dirPath, fileList = []) {
  if (!fs.existsSync(dirPath)) return fileList;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function compressPng(filePath) {
  const original = fs.readFileSync(filePath);
  const originalSize = original.length;
  const compressed = await sharp(original)
    .png({ quality: 80, compressionLevel: 9, effort: 10 })
    .toBuffer();
  if (compressed.length < originalSize) {
    fs.writeFileSync(filePath, compressed);
    return { originalSize, newSize: compressed.length, saved: true };
  }
  return { originalSize, newSize: originalSize, saved: false };
}

async function compressJpg(filePath) {
  const original = fs.readFileSync(filePath);
  const originalSize = original.length;
  const compressed = await sharp(original)
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  if (compressed.length < originalSize) {
    fs.writeFileSync(filePath, compressed);
    return { originalSize, newSize: compressed.length, saved: true };
  }
  return { originalSize, newSize: originalSize, saved: false };
}

function compressSvg(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const originalSize = Buffer.byteLength(original);
  const result = optimize(original, {
    multipass: true,
    plugins: [
      { name: 'preset-default' },
      { name: 'removeDimensions', active: false },
    ],
  });
  const newSize = Buffer.byteLength(result.data);
  if (newSize < originalSize) {
    fs.writeFileSync(filePath, result.data);
    return { originalSize, newSize, saved: true };
  }
  return { originalSize, newSize: originalSize, saved: false };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

async function main() {
  console.log('Compressing images in src/shared/assets...\n');

  const absDir = path.resolve(ROOT, ASSET_DIR);
  const files = getAllFiles(absDir);

  let totalOriginal = 0;
  let totalNew = 0;
  let pngCount = 0;
  let svgCount = 0;
  let skippedCount = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);

    if (SKIP_FILES.includes(basename)) {
      skippedCount++;
      continue;
    }

    try {
      let result;
      if (ext === '.png') {
        result = await compressPng(filePath);
        pngCount++;
      } else if (ext === '.jpg' || ext === '.jpeg') {
        result = await compressJpg(filePath);
        pngCount++;
      } else if (ext === '.svg') {
        result = compressSvg(filePath);
        svgCount++;
      } else {
        continue;
      }

      totalOriginal += result.originalSize;
      totalNew += result.newSize;

      if (result.saved) {
        const pct = ((1 - result.newSize / result.originalSize) * 100).toFixed(1);
        console.log(`  ✓ ${basename}: ${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)} (-${pct}%)`);
      }
    } catch (err) {
      console.log(`  ✗ ${basename}: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Compression complete!');
  console.log(`  PNG/JPG: ${pngCount} files`);
  console.log(`  SVG: ${svgCount} files`);
  console.log(`  Skipped: ${skippedCount} files`);
  console.log(`  Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalNew)}`);
  console.log(`  Saved: ${formatBytes(totalOriginal - totalNew)} (-${((1 - totalNew / totalOriginal) * 100).toFixed(1)}%)`);
}

main().catch(console.error);
