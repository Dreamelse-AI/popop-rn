/**
 * Upload assets-png/ to OSS CDN.
 * CDN path: popop-fe/assets/<relative-path>
 * fe reads via: cdnImage('assets/<relative-path>')
 *
 * Usage:
 *   node scripts/upload-cdn.mjs
 *
 * Requires scripts/cdn-config.mjs with OSS credentials (gitignored).
 */

import { createRequire } from 'module'
import { readdirSync, statSync, existsSync } from 'fs'
import { join, relative, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

const CONFIG_PATH = join(__dirname, 'cdn-config.mjs')
if (!existsSync(CONFIG_PATH)) {
  console.error(`[upload-cdn] Config not found: ${CONFIG_PATH}`)
  console.error('[upload-cdn] Copy scripts/cdn-config.example.mjs to scripts/cdn-config.mjs and fill in credentials.')
  process.exit(1)
}

const { default: config } = await import(CONFIG_PATH)
const OSS = require('../node_modules/ali-oss')

const client = new OSS({
  region: config.region,
  accessKeyId: config.accessKeyId,
  accessKeySecret: config.accessKeySecret,
  bucket: config.bucket,
})

const ASSETS_DIR = join(__dirname, '../src/shared/assets-png')
const OSS_PREFIX = 'popop-fe/assets/'

function findPngs(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...findPngs(full))
    } else if (extname(entry).toLowerCase() === '.png') {
      results.push(full)
    }
  }
  return results
}

const files = findPngs(ASSETS_DIR)
console.log(`Uploading ${files.length} PNG files to OSS...\n`)

let success = 0
let failed = 0

for (const filePath of files) {
  const rel = relative(ASSETS_DIR, filePath).replace(/\\/g, '/')
  const ossPath = OSS_PREFIX + rel
  try {
    await client.put(ossPath, filePath)
    console.log(`✓ ${rel}`)
    success++
  } catch (e) {
    console.error(`✗ ${rel}: ${e.message}`)
    failed++
  }
}

console.log(`\nDone. Success: ${success}, Failed: ${failed}`)
if (failed > 0) process.exit(1)
