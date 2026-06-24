/**
 * Replaces SVG component JSX usage with Image component usage in RN files.
 *
 * Transforms:
 *   <IconXxx width={24} height={24} />
 *   <IconXxx width={24} height={24}/>
 * to:
 *   <Image source={IconXxx} style={{width: 24, height: 24}} />
 *
 * Also ensures `Image` is imported from 'react-native' if not already.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../src')

// Names of PNG-required vars (derived from require('@/shared/assets-png/...'))
const PNG_VAR_PATTERN = /const ([A-Za-z_][A-Za-z0-9_]*) = require\('@\/shared\/assets-png\//g

function findFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) results.push(...findFiles(full))
    else if (['.tsx', '.ts'].includes(extname(entry))) results.push(full)
  }
  return results
}

function getPngVars(content) {
  const vars = new Set()
  let m
  const re = /const ([A-Za-z_][A-Za-z0-9_]*) = require\('@\/shared\/assets-png\//g
  while ((m = re.exec(content)) !== null) vars.add(m[1])
  return vars
}

function transformFile(filePath) {
  let content = readFileSync(filePath, 'utf8')
  const pngVars = getPngVars(content)
  if (pngVars.size === 0) return false

  let changed = false

  for (const varName of pngVars) {
    // Match <VarName width={w} height={h} /> or <VarName width={w} height={h}/>
    // Also handle no-space before />
    // width and height can be {number} or number
    const tagRe = new RegExp(
      `<${varName}\\s+width=\\{?(\\d+)\\}?\\s+height=\\{?(\\d+)\\}?\\s*/?>`,
      'g'
    )
    const newContent = content.replace(tagRe, (_, w, h) => {
      return `<Image source={${varName}} style={{width: ${w}, height: ${h}}} />`
    })
    if (newContent !== content) {
      content = newContent
      changed = true
    }
  }

  if (!changed) return false

  // Ensure Image is imported from react-native
  if (!content.includes("from 'react-native'") && !content.includes('from "react-native"')) {
    // No react-native import at all — add it
    content = `import { Image } from 'react-native'\n` + content
  } else {
    // react-native import exists — add Image if missing
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/,
      (match, imports) => {
        if (imports.includes('Image')) return match
        const trimmed = imports.trim().replace(/,\s*$/, '')
        return `import { ${trimmed}, Image } from 'react-native'`
      }
    )
  }

  writeFileSync(filePath, content, 'utf8')
  return true
}

const files = findFiles(ROOT)
let count = 0
for (const f of files) {
  if (transformFile(f)) {
    console.log(`✓ ${f.replace(ROOT + '/', '')}`)
    count++
  }
}
console.log(`\nDone. Modified ${count} files.`)
