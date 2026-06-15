/**
 * 从 popop-fe 同步 i18n 文案与配置常量来源。
 * FE 源：packages/shared/src/i18n/
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const feI18n = path.join(root, '..', 'popop-fe', 'packages', 'shared', 'src', 'i18n')
const rnI18n = path.join(root, 'src', 'i18n')

if (!fs.existsSync(feI18n)) {
  console.error(`找不到 FE i18n：${feI18n}`)
  process.exit(1)
}

const localesDir = path.join(feI18n, 'locales')
for (const file of fs.readdirSync(localesDir)) {
  if (!file.endsWith('.json')) continue
  fs.copyFileSync(path.join(localesDir, file), path.join(rnI18n, 'locales', file))
}

console.log('sync-i18n-from-fe done → src/i18n/locales/')
