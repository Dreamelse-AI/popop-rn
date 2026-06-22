import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ASSETS_DIR = path.join(ROOT, 'assets')
const LOGO_SVG_PATH = path.join(ROOT, 'src/shared/assets/me/popop-logo-large.svg')

/** Matches AuthLoginShell / splash loading page background */
const APP_BG = '#fbf2d8'
const LOGO_ASPECT = 132.03 / 168.302

function loadLogoSvg() {
  const raw = fs.readFileSync(LOGO_SVG_PATH, 'utf8')
  return raw
    .replace(/var\(--fill-0, [^)]+\)/g, (match) => {
      if (match.includes('black')) return 'black'
      if (match.includes('#f0da9c')) return '#f0da9c'
      if (match.includes('white')) return 'white'
      return 'black'
    })
    .replace(/var\(--stroke-0, [^)]+\)/g, 'black')
}

async function renderLogoPng(svg, width, height) {
  return sharp(Buffer.from(svg)).resize(width, height).png().toBuffer()
}

async function writeSolidPng(filePath, size, color) {
  await sharp({
    create: { width: size, height: size, channels: 4, background: color },
  })
    .png()
    .toFile(filePath)
}

async function writeLogoOnBackground(filePath, size, logoScale) {
  const svg = loadLogoSvg()
  const logoWidth = Math.round(size * logoScale)
  const logoHeight = Math.round(logoWidth * LOGO_ASPECT)
  const logoBuf = await renderLogoPng(svg, logoWidth, logoHeight)
  const left = Math.round((size - logoWidth) / 2)
  const top = Math.round((size - logoHeight) / 2)

  await sharp({
    create: { width: size, height: size, channels: 4, background: APP_BG },
  })
    .composite([{ input: logoBuf, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(filePath)
}

async function writeAdaptiveForeground(filePath, size) {
  const svg = loadLogoSvg()
  const logoWidth = Math.round(size * 0.62)
  const logoHeight = Math.round(logoWidth * LOGO_ASPECT)
  const logoBuf = await renderLogoPng(svg, logoWidth, logoHeight)
  const left = Math.round((size - logoWidth) / 2)
  const top = Math.round((size - logoHeight) / 2)

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logoBuf, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(filePath)
}

async function main() {
  console.log('Generating app icons from popop-logo-large.svg...\n')

  await writeLogoOnBackground(path.join(ASSETS_DIR, 'icon.png'), 1024, 0.55)
  console.log('  ✓ assets/icon.png')

  await writeLogoOnBackground(path.join(ASSETS_DIR, 'splash-icon.png'), 1024, 0.45)
  console.log('  ✓ assets/splash-icon.png')

  await writeSolidPng(path.join(ASSETS_DIR, 'android-icon-background.png'), 1024, APP_BG)
  console.log('  ✓ assets/android-icon-background.png')

  await writeAdaptiveForeground(path.join(ASSETS_DIR, 'android-icon-foreground.png'), 1024)
  console.log('  ✓ assets/android-icon-foreground.png')

  await writeLogoOnBackground(path.join(ASSETS_DIR, 'favicon.png'), 48, 0.7)
  console.log('  ✓ assets/favicon.png')

  await writeAdaptiveForeground(path.join(ASSETS_DIR, 'android-icon-monochrome.png'), 432)
  console.log('  ✓ assets/android-icon-monochrome.png')

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
