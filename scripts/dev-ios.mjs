#!/usr/bin/env node
/**
 * iOS 模拟器开发流程（参考 rn-debug-demo/scripts/dev-ios.mjs）
 *
 * popop-rn 含 Apple Sign In entitlement，Expo 56 的 `expo run:ios` 会强制要求
 * 代码签名证书。本脚本改用 xcodebuild 直接构建模拟器包，绕过该限制。
 *
 * 用法:
 *   node scripts/dev-ios.mjs           # 构建（如需）+ 启动 Metro + 打开模拟器
 *   node scripts/dev-ios.mjs --attach   # 仅启动 Metro（Dev Client 已安装时）
 *   node scripts/dev-ios.mjs --rebuild  # 强制重新构建并安装 Dev Client
 */
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readAppIdentity } from './lib/app-identity.mjs'
import { IOS_METRO_PORT, freeMetroPorts } from './lib/metro-ports.mjs'

const appRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const iosDir = join(appRoot, 'ios')
const workspace = join(iosDir, 'Popop.xcworkspace')
const scheme = 'Popop'
const { iosBundleId: bundleId } = readAppIdentity(appRoot)
const simulatorName = process.env.IOS_SIMULATOR ?? 'iPhone 17'
const metroPort = IOS_METRO_PORT
const derivedDataPath = join(iosDir, 'build')
const buildStampPath = join(derivedDataPath, '.dev-client-stamp')
const localAppPath = join(derivedDataPath, 'Build/Products/Debug-iphonesimulator/Popop.app')

const attachOnly = process.argv.includes('--attach')
const forceRebuild = process.argv.includes('--rebuild')
const expoStartExtraArgs = process.argv
  .slice(2)
  .filter((arg) => !['--attach', '--rebuild'].includes(arg))

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

function getAppBundleId(appPath) {
  try {
    return execSync(
      `/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "${join(appPath, 'Info.plist')}"`,
      { encoding: 'utf8' },
    ).trim()
  } catch {
    return null
  }
}

function isValidAppBundle(appPath) {
  if (!existsSync(join(appPath, 'Info.plist'))) return false
  return getAppBundleId(appPath) === bundleId
}

function readNativeFingerprint() {
  const pkg = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))
  return `${bundleId}|${pkg.dependencies?.expo ?? ''}|${pkg.dependencies?.['react-native'] ?? ''}|${pkg.dependencies?.['expo-dev-client'] ?? ''}`
}

function readBuildStamp() {
  try {
    return readFileSync(buildStampPath, 'utf8').trim()
  } catch {
    return null
  }
}

function writeBuildStamp(fingerprint) {
  writeFileSync(buildStampPath, `${fingerprint}\n`)
}

function needsNativeRebuild() {
  if (forceRebuild) return true

  const fingerprint = readNativeFingerprint()
  if (readBuildStamp() !== fingerprint) return true
  if (!isValidAppBundle(localAppPath)) return true

  return false
}

function ensurePodsInstalled({ force = false } = {}) {
  const podfileLock = join(iosDir, 'Podfile.lock')
  const needsInstall = force || !existsSync(podfileLock) || !existsSync(workspace)
  if (needsInstall) {
    if (!existsSync(workspace) && existsSync(join(iosDir, 'Podfile'))) {
      console.log('[ios] 未找到 Popop.xcworkspace，正在运行 pod install...\n')
    } else {
      console.log('[ios] pod install...\n')
    }
    run('pod', ['install'], { cwd: iosDir })
  }

  if (!existsSync(workspace)) {
    console.error('[ios] pod install 后仍缺少 Popop.xcworkspace。')
    console.error('      请检查上方 pod 输出；常见原因是 Google Sign-In 依赖需要 modular headers。')
    console.error('      可尝试: cd ios && pod install')
    process.exit(1)
  }
}

function findExistingAppBundle() {
  if (isValidAppBundle(localAppPath)) {
    return localAppPath
  }

  return null
}

function buildForSimulator(udid) {
  if (!existsSync(iosDir)) {
    console.error('[ios] 缺少 ios/ 目录，请先运行: npx expo prebuild')
    process.exit(1)
  }

  ensurePodsInstalled({ force: forceRebuild })

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

  writeBuildStamp(readNativeFingerprint())
}

function installAndLaunch(udid, appPath) {
  console.log(`[ios] 安装 ${appPath}`)
  run('xcrun', ['simctl', 'install', udid, appPath])
  console.log(`[ios] 启动 ${bundleId}`)
  run('xcrun', ['simctl', 'launch', udid, bundleId])
}

function ensureDevClientOnSimulator(udid) {
  if (needsNativeRebuild()) {
    if (forceRebuild) {
      console.log('[ios] --rebuild：强制重新构建 Dev Client')
    } else if (readBuildStamp() !== readNativeFingerprint()) {
      console.log('[ios] 依赖版本已变化，需重新构建 Dev Client（避免 MessageQueue 等原生/JS 不一致）')
    } else {
      console.log('[ios] 本地缺少有效构建产物，开始构建 Dev Client')
    }

    buildForSimulator(udid)
  } else if (!isDevClientInstalled(udid)) {
    console.log('[ios] 模拟器未安装 Dev Client，使用本地构建产物安装')
  } else {
    console.log('[ios] Dev Client 已是最新，跳过构建')
    return
  }

  const appPath = findExistingAppBundle()

  if (!appPath) {
    console.error('[ios] 找不到有效的 Popop.app，构建可能失败。')
    console.error('      可尝试: pnpm ios:sim:rebuild')
    process.exit(1)
  }

  installAndLaunch(udid, appPath)
}

function startMetro() {
  freeMetroPorts([metroPort])
  console.log(`\n[ios] 启动 Metro (port ${metroPort})...\n`)
  run('npx', [
    'expo',
    'start',
    '--dev-client',
    '--ios',
    '--port',
    metroPort,
    ...expoStartExtraArgs,
  ])
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
