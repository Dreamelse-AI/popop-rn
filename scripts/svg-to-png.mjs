import { createRequire } from 'module'
import { readdirSync, statSync, mkdirSync } from 'fs'
import { join, relative, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const sharp = require('../node_modules/sharp')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = join(__dirname, '../src/shared/assets')
const OUT_DIR = join(__dirname, '../src/shared/assets-png')
const SCALE = 3

function findSvgs(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...findSvgs(full))
    } else if (extname(entry).toLowerCase() === '.svg') {
      results.push(full)
    }
  }
  return results
}

const svgs = findSvgs(ASSETS_DIR)
console.log(`Converting ${svgs.length} SVGs at ${SCALE}x scale...\n`)

for (const svgPath of svgs) {
  const rel = relative(ASSETS_DIR, svgPath)
  const outPath = join(OUT_DIR, rel.replace(/\.svg$/i, '.png'))
  mkdirSync(dirname(outPath), { recursive: true })

  try {
    const info = await sharp(svgPath, { density: 72 * SCALE })
      .png({ compressionLevel: 9, palette: true })
      .toFile(outPath)
    console.log(`✓ ${rel} → ${info.width}×${info.height} (${(info.size / 1024).toFixed(1)}kb)`)
  } catch (e) {
    console.error(`✗ ${rel}: ${e.message}`)
  }
}

console.log(`\nDone. Output: ${OUT_DIR}`)
