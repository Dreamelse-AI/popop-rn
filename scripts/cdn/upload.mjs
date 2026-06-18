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

async function main() {
  console.log('Uploading images to OSS...\n');
  let success = 0;
  let failed = 0;

  for (const { dir, ossPath } of config.localAssetDirs) {
    const absDir = path.resolve(__dirname, dir);
    console.log(`\nScanning: ${absDir}`);
    const files = getAllImages(absDir);
    console.log(`  Found ${files.length} image files\n`);

    for (const filePath of files) {
      const relativePath = path.relative(absDir, filePath);
      const ossKey = `${config.ossPrefix}${ossPath}${relativePath}`;
      try {
        await client.put(ossKey, filePath);
        console.log(`  OK ${path.basename(filePath)} -> ${config.cdnDomain}/${ossKey}`);
        success++;
      } catch (err) {
        console.log(`  FAIL ${path.basename(filePath)}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Upload complete! Success: ${success}, Failed: ${failed}\n`);
}

main().catch((err) => {
  console.error('Upload error:', err.message);
  process.exit(1);
});
