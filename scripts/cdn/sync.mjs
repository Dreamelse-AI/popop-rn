/**
 * Pre-push: compress new/changed images and upload to CDN.
 * Tracks uploaded files via a manifest to skip unchanged ones (incremental).
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CONFIG_PATH = path.resolve(__dirname, 'config.mjs');
const MANIFEST_PATH = path.resolve(__dirname, 'upload-manifest.json');

if (!fs.existsSync(CONFIG_PATH)) {
  console.log('[cdn:sync] config.mjs not found. Copy config.example.mjs and fill in your AccessKey.');
  console.log('[cdn:sync] Skipping CDN upload.');
  process.exit(0);
}

function getFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  }
  return {};
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function findAllImages(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findAllImages(fullPath));
    } else if (/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  const manifest = loadManifest();
  const assetsDir = path.resolve(ROOT, 'src/shared/assets');
  const allImages = findAllImages(assetsDir);

  const changed = allImages.filter((f) => {
    const hash = getFileHash(f);
    const rel = path.relative(assetsDir, f);
    if (manifest[rel] === hash) return false;
    manifest[rel] = hash;
    return true;
  });

  if (changed.length === 0) {
    console.log('[cdn:sync] No new or changed images. Skipping.');
    saveManifest(manifest);
    return;
  }

  console.log(`[cdn:sync] ${changed.length} new/changed images detected.`);

  // Step 1: Compress
  console.log('[cdn:sync] Compressing...');
  execSync('node scripts/compress-assets.mjs', { cwd: ROOT, stdio: 'inherit' });

  // Recompute hashes after compression and stage the compressed files
  for (const f of changed) {
    const rel = path.relative(assetsDir, f);
    if (fs.existsSync(f)) {
      manifest[rel] = getFileHash(f);
      execSync(`git add "${f}"`, { cwd: ROOT });
    }
  }

  // Step 2: Upload
  console.log('[cdn:sync] Uploading to CDN...');
  execSync('node scripts/cdn/upload.mjs', { cwd: ROOT, stdio: 'inherit' });

  saveManifest(manifest);
  console.log('[cdn:sync] Done!');
}

main().catch((err) => {
  console.error('[cdn:sync] Error:', err.message);
  process.exit(1);
});
