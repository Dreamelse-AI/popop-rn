#!/usr/bin/env node
/**
 * 一次性初始化 Android 模拟器环境：
 * - 链接 Homebrew cmdline-tools 到 ANDROID_HOME
 * - 接受 SDK 许可
 * - 安装 API 36 system image
 * - 创建默认 AVD（popop_api36）
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  DEFAULT_AVD,
  DEFAULT_DEVICE_PROFILE,
  DEFAULT_SYSTEM_IMAGE,
  ensureCmdlineTools,
  listAvds,
  resolveAndroidHome,
  resolveAvdmanager,
  resolveEmulator,
  resolveSdkmanager,
  withAndroidEnv,
} from './lib/android-sdk.mjs'

function run(bin, args, { silent = false } = {}) {
  const result = spawnSync(bin, args, {
    env: withAndroidEnv(),
    encoding: 'utf8',
    stdio: silent ? 'pipe' : 'inherit',
  })

  if (result.status !== 0) {
    if (silent && result.stderr) console.error(result.stderr)
    process.exit(result.status ?? 1)
  }

  return result
}

const sdkRoot = resolveAndroidHome()
if (!sdkRoot) {
  console.error('[android] 未找到 Android SDK。请设置 ANDROID_HOME 或安装 Android Studio。')
  process.exit(1)
}

console.log('[android] SDK:', sdkRoot)
ensureCmdlineTools(sdkRoot)

const sdkmanager = resolveSdkmanager(sdkRoot)
const avdmanager = resolveAvdmanager(sdkRoot)
const emulator = resolveEmulator(sdkRoot)

if (!sdkmanager || !avdmanager || !emulator) {
  console.error('[android] 缺少 sdkmanager / avdmanager / emulator，请检查 SDK 安装。')
  process.exit(1)
}

console.log('[android] 接受 SDK 许可...')
run(sdkmanager, ['--sdk_root=' + sdkRoot, '--licenses'], { silent: true })

const imageDir = join(sdkRoot, 'system-images', 'android-36', 'google_apis', 'arm64-v8a')
if (!existsSync(imageDir)) {
  console.log('[android] 安装 system image:', DEFAULT_SYSTEM_IMAGE)
  run(sdkmanager, ['--sdk_root=' + sdkRoot, '--install', DEFAULT_SYSTEM_IMAGE])
} else {
  console.log('[android] system image 已存在，跳过安装')
}

const avds = listAvds(emulator)
if (avds.includes(DEFAULT_AVD)) {
  console.log(`[android] AVD「${DEFAULT_AVD}」已存在`)
} else {
  console.log(`[android] 创建 AVD「${DEFAULT_AVD}」(${DEFAULT_DEVICE_PROFILE})...`)
  const create = spawnSync(
    avdmanager,
    ['create', 'avd', '-n', DEFAULT_AVD, '-k', DEFAULT_SYSTEM_IMAGE, '-d', DEFAULT_DEVICE_PROFILE],
  {
    env: withAndroidEnv(),
    input: 'no\n',
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit'],
  },
  )
  if (create.status !== 0) process.exit(create.status ?? 1)
}

console.log('\n[android] 模拟器环境就绪。可用命令:')
console.log('  pnpm android:emu        # 启动模拟器')
console.log('  pnpm android:sim        # 构建 + Metro + 模拟器')
console.log('  emulator -avd', DEFAULT_AVD)
