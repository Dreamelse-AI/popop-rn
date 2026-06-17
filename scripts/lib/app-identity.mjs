import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 从 app.config.ts 读取 bundle id，避免 dev 脚本与 Expo 配置不一致。
 */
export function readAppIdentity(appRoot) {
  const source = readFileSync(join(appRoot, 'app.config.ts'), 'utf8')
  const iosMatch = source.match(/bundleIdentifier:\s*['"]([^'"]+)['"]/)
  const androidMatch = source.match(/package:\s*['"]([^'"]+)['"]/)

  const iosBundleId = iosMatch?.[1]
  const androidPackage = androidMatch?.[1]

  if (!iosBundleId) {
    throw new Error('无法在 app.config.ts 中解析 ios.bundleIdentifier')
  }

  return { iosBundleId, androidPackage }
}
