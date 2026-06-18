#!/usr/bin/env node
/**
 * Android 模拟器开发流程（对标 scripts/dev-ios.mjs）
 *
 * 用法:
 *   node scripts/dev-android-emulator.mjs           # 安装 Dev Client（如需）+ 启动模拟器 + Metro
 *   node scripts/dev-android-emulator.mjs --attach  # 仅启动 Metro（Dev Client 已安装时）
 *   node scripts/dev-android-emulator.mjs --rebuild # 强制重新构建并安装 Dev Client
 */
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  DEFAULT_AVD,
  isEmulatorBooted,
  listEmulatorSerials,
  resolveAdb,
  resolveAndroidHome,
  resolveEmulator,
  resolveExpoDeviceName,
  buildExpoRunAndroidArgs,
  expoRunAndroidEnv,
  setupMetroReverse,
  sleep,
  withAndroidEnv,
} from './lib/android-sdk.mjs'
import { readAppIdentity } from './lib/app-identity.mjs'
import { ANDROID_METRO_PORT, freeMetroPorts } from './lib/metro-ports.mjs'

const appRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const metroPort = ANDROID_METRO_PORT
const avdName = process.env.ANDROID_AVD ?? DEFAULT_AVD
const { androidPackage } = readAppIdentity(appRoot)
const attachOnly = process.argv.includes('--attach')
const forceRebuild = process.argv.includes('--rebuild')

function run(command, args, opts = {}) {
  const { env: extraEnv, ...rest } = opts
  const result = spawnSync(command, args, {
    cwd: appRoot,
    stdio: 'inherit',
    shell: false,
    env: withAndroidEnv(extraEnv),
    ...rest,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function isDevClientInstalled(adb, serial, packageName) {
  const result = spawnSync(adb, ['-s', serial, 'shell', 'pm', 'path', packageName], {
    encoding: 'utf8',
    env: withAndroidEnv({ ANDROID_SERIAL: serial }),
  })
  return result.status === 0 && result.stdout.includes('package:')
}

function ensureEmulatorRunning() {
  const sdkRoot = resolveAndroidHome()
  if (!sdkRoot) {
    console.error('[android] 未找到 Android SDK')
    process.exit(1)
  }

  const adb = resolveAdb(sdkRoot)
  let serials = listEmulatorSerials(adb)

  if (serials.length === 0) {
    const emulatorPath = resolveEmulator(sdkRoot)
    if (!emulatorPath) {
      console.error('[android] 未找到 emulator，请运行: pnpm android:emu:setup')
      process.exit(1)
    }

    console.log(`[android] 启动模拟器 ${avdName}...`)
    run('node', [join(appRoot, 'scripts/android-emulator.mjs'), '--wait', avdName])
    serials = listEmulatorSerials(adb)
  }

  if (serials.length === 0) {
    console.error('[android] 模拟器未连接。请先运行: pnpm android:emu')
    process.exit(1)
  }

  const serial = serials[0]
  if (!isEmulatorBooted(adb, serial)) {
    console.log('[android] 等待模拟器开机...')
    const start = Date.now()
    while (Date.now() - start < 180_000) {
      if (isEmulatorBooted(adb, serial)) break
      sleep(2000)
    }
  }

  return { adb, serial }
}

function setupAdbReverse(adb, serial) {
  setupMetroReverse(adb, serial, metroPort)
  console.log(`[android] adb reverse → Metro ${metroPort} (${serial})`)
}

function ensureDevClientOnEmulator(serial) {
  const adb = resolveAdb()
  const installed = isDevClientInstalled(adb, serial, androidPackage)

  if (attachOnly && !installed) {
    console.error(`[android] 模拟器未安装 Dev Client（${androidPackage}）。`)
    console.error('        请先运行: pnpm android:sim:build')
    console.error('        或完整流程: pnpm android:sim')
    process.exit(1)
  }

  if (forceRebuild) {
    console.log('[android] --rebuild：强制重新构建 Dev Client')
  } else if (!installed) {
    console.log(`[android] 模拟器未安装 Dev Client，开始构建...`)
  } else {
    console.log('[android] Dev Client 已安装，跳过构建')
    return
  }

  setupAdbReverse(adb, serial)
  const expoDevice = resolveExpoDeviceName(adb, serial)
  console.log(`[android] Expo 设备名: ${expoDevice} (adb: ${serial})`)
  run('npx', buildExpoRunAndroidArgs({
    deviceName: expoDevice,
    metroPort,
    extraArgs: ['--no-bundler'],
  }), {
    env: expoRunAndroidEnv(serial, metroPort),
  })
}

function startMetro(serial) {
  freeMetroPorts([metroPort])
  console.log(`\n[android] 启动 Metro (port ${metroPort})...\n`)
  run('npx', ['expo', 'start', '--dev-client', '--android', '--port', metroPort], {
    env: { ANDROID_SERIAL: serial },
  })
}

// --- main ---

const { adb, serial } = ensureEmulatorRunning()

if (!attachOnly) {
  ensureDevClientOnEmulator(serial)
}

setupAdbReverse(adb, serial)
startMetro(serial)
