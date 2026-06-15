#!/usr/bin/env node
/**
 * iOS 模拟器开发流程（参考 rn-debug-demo/scripts/dev-ios.mjs）
 *
 * popop-rn 含 Apple Sign In entitlement，Expo 56 的 `expo run:ios` 会强制要求
 * 代码签名证书。本脚本改用 xcodebuild 直接构建模拟器包，绕过该限制。
 *
 * 用法:
 *   node scripts/dev-ios.mjs           # 构建（如需）+ 启动 Metro + 打开模拟器
 *   node scripts/dev-ios.mjs --attach  # 仅启动 Metro（Dev Client 已安装时）
 */
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const iosDir = join(appRoot, 'ios')
const workspace = join(iosDir, 'Popop.xcworkspace')
const scheme = 'Popop'
const bundleId = 'com.popop.app'
const simulatorName = process.env.IOS_SIMULATOR ?? 'iPhone 17'
const metroPort = process.env.METRO_PORT ?? '8082'
const derivedDataPath = join(iosDir, 'build')

const attachOnly = process.argv.includes('--attach')

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: appRoot,
    stdio: 'inherit',
    shell: false,
    ...opts,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function query(command) {
  return execSync(command, { encoding: 'utf8', cwd: appRoot }).trim()
}

function resolveSimulatorUdid(name) {
  const json = JSON.parse(query('xcrun simctl list devices available -j'))
  for (const devices of Object.values(json.devices)) {
    for (const device of devices) {
      if (device.name === name && device.isAvailable !== false) {
        return device.udid
      }
    }
  }
  throw new Error(`找不到模拟器「${name}」，请先在 Xcode 中安装对应 Runtime`)
}

function ensureSimulatorBooted(udid) {
  try {
    execSync(`xcrun simctl boot ${udid}`, { stdio: 'ignore' })
  } catch {
    // 已 Booted
  }
  spawnSync('open', ['-a', 'Simulator'], { stdio: 'ignore' })
}

function isDevClientInstalled(udid) {
  try {
    execSync(`xcrun simctl get_app_container ${udid} ${bundleId}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function isValidAppBundle(appPath) {
  return existsSync(join(appPath, 'Info.plist'))
}

function findExistingAppBundle() {
  const localApp = join(derivedDataPath, 'Build/Products/Debug-iphonesimulator/Popop.app')
  if (isValidAppBundle(localApp)) {
    return localApp
  }

  try {
    const derivedRoot = join(process.env.HOME, 'Library/Developer/Xcode/DerivedData')
    const dirs = readdirSync(derivedRoot).filter((d) => d.startsWith('Popop-'))
    for (const dir of dirs) {
      const app = join(derivedRoot, dir, 'Build/Products/Debug-iphonesimulator/Popop.app')
      if (isValidAppBundle(app)) {
        return app
      }
    }
  } catch {
    // ignore
  }

  return null
}

function buildForSimulator(udid) {
  if (!existsSync(workspace)) {
    console.error('[ios] 缺少 ios/ 目录，请先运行: npx expo prebuild')
    process.exit(1)
  }

  console.log(`[ios] 构建 ${scheme} → ${simulatorName}（xcodebuild，无需签名证书）...\n`)

  const args = [
    '-workspace', workspace,
    '-scheme', scheme,
    '-configuration', 'Debug',
    '-sdk', 'iphonesimulator',
    '-destination', `id=${udid}`,
    '-derivedDataPath', derivedDataPath,
    'COMPILER_INDEX_STORE_ENABLE=NO',
    'build',
  ]

  run('xcodebuild', args, {
    env: {
      ...process.env,
      SKIP_BUNDLING: '1',
      RCT_NO_LAUNCH_PACKAGER: 'true',
      RCT_METRO_PORT: metroPort,
    },
  })
}

function installAndLaunch(udid, appPath) {
  console.log(`[ios] 安装 ${appPath}`)
  run('xcrun', ['simctl', 'install', udid, appPath])
  console.log(`[ios] 启动 ${bundleId}`)
  run('xcrun', ['simctl', 'launch', udid, bundleId])
}

function ensureDevClientOnSimulator(udid) {
  if (isDevClientInstalled(udid)) {
    console.log('[ios] Dev Client 已安装在模拟器上')
    return
  }

  let appPath = findExistingAppBundle()

  if (!appPath) {
    buildForSimulator(udid)
    appPath = join(derivedDataPath, 'Build/Products/Debug-iphonesimulator/Popop.app')
  } else {
    console.log(`[ios] 使用已有构建产物: ${appPath}`)
  }

  if (!isValidAppBundle(appPath)) {
    console.error('[ios] 找不到有效的 Popop.app，构建可能失败。')
    console.error('      可尝试在 Xcode 中打开 ios/Popop.xcworkspace 手动 Build。')
    process.exit(1)
  }

  installAndLaunch(udid, appPath)
}

function startMetro() {
  console.log(`\n[ios] 启动 Metro (port ${metroPort})...\n`)
  run('npx', ['expo', 'start', '--dev-client', '--ios', '--port', metroPort])
}

// --- main ---

const udid = resolveSimulatorUdid(simulatorName)
ensureSimulatorBooted(udid)

if (attachOnly) {
  startMetro()
} else {
  ensureDevClientOnSimulator(udid)
  startMetro()
}
