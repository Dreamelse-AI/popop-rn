import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new OSS({
  region: config.oss.region,
  accessKeyId: config.oss.accessKeyId,
  accessKeySecret: config.oss.accessKeySecret,
  bucket: config.oss.bucket,
});

function getAllImages(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllImages(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (config.imageExtensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function resolveOssKey(filePath) {
  const absPath = path.resolve(filePath);
  for (const { dir, ossPath } of config.localAssetDirs) {
    const absDir = path.resolve(__dirname, dir);
    if (absPath === absDir || absPath.startsWith(`${absDir}${path.sep}`)) {
      const relativePath = path.relative(absDir, absPath);
      return `${config.ossPrefix}${ossPath}${relativePath}`;
    }
  }
  return null;
}

async function uploadFile(filePath) {
  const ossKey = resolveOssKey(filePath);
  if (!ossKey) {
    console.log(`  SKIP ${path.basename(filePath)}: not under configured asset dirs`);
    return 'skipped';
  }

  await client.put(ossKey, filePath);
  console.log(`  OK ${path.basename(filePath)} -> ${config.cdnDomain}/${ossKey}`);
  return 'success';
}

async function main() {
  const filesFromArgs = process.argv.slice(2).map((f) => path.resolve(f));
  let files = filesFromArgs;

  if (files.length === 0) {
    console.log('Uploading images to OSS...\n');
    files = [];
    for (const { dir } of config.localAssetDirs) {
      const absDir = path.resolve(__dirname, dir);
      console.log(`\nScanning: ${absDir}`);
      const dirFiles = getAllImages(absDir);
      console.log(`  Found ${dirFiles.length} image files\n`);
      files.push(...dirFiles);
    }
  } else {
    console.log(`Uploading ${files.length} image(s) to OSS...\n`);
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const filePath of files) {
    try {
      const result = await uploadFile(filePath);
      if (result === 'success') success++;
      else skipped++;
    } catch (err) {
      console.log(`  FAIL ${path.basename(filePath)}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Upload complete! Success: ${success}, Failed: ${failed}, Skipped: ${skipped}\n`);
}

main().catch((err) => {
  console.error('Upload error:', err.message);
  process.exit(1);
});
