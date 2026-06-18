#!/usr/bin/env node
/**
 * Android USB 真机开发流程（参考 rn-debug-demo/scripts/dev-android.mjs）
 *
 * 用法:
 *   node scripts/dev-android.mjs           # 安装 Dev Client（如需）+ 启动 Metro + 打开真机
 *   node scripts/dev-android.mjs --attach  # 仅启动 Metro（Dev Client 已安装时）
 *   node scripts/dev-android.mjs --rebuild # 强制重新构建并安装 Dev Client
 */
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  buildExpoRunAndroidArgs,
  expoRunAndroidEnv,
  resolveExpoDeviceName,
  setupMetroReverse,
  withAndroidEnv,
} from './lib/android-sdk.mjs'
import { readAppIdentity } from './lib/app-identity.mjs'
import { ANDROID_METRO_PORT, freeMetroPorts } from './lib/metro-ports.mjs'

const appRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const metroPort = ANDROID_METRO_PORT
const { androidPackage } = readAppIdentity(appRoot)
const attachOnly = process.argv.includes('--attach')
const forceRebuild = process.argv.includes('--rebuild')
const expoStartExtraArgs = process.argv
  .slice(2)
  .filter((arg) => !['--attach', '--rebuild'].includes(arg))

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

function resolveAdb() {
  const candidates = [
    process.env.ANDROID_HOME && join(process.env.ANDROID_HOME, 'platform-tools', 'adb'),
    process.env.ANDROID_SDK_ROOT && join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb'),
    process.env.HOME && join(process.env.HOME, 'Library/Android/sdk/platform-tools/adb'),
  ].filter(Boolean)

  for (const adb of candidates) {
    try {
      const result = spawnSync(adb, ['version'], { encoding: 'utf8' })
      if (result.status === 0) return adb
    } catch {
      // try next candidate
    }
  }
  return 'adb'
}

function getPhysicalDeviceSerial(adb) {
  let output
  try {
    output = spawnSync(adb, ['devices', '-l'], { encoding: 'utf8' }).stdout ?? ''
  } catch {
    console.error('[android] adb 不可用，请确认 Android SDK platform-tools 已安装')
    process.exit(1)
  }

  const devices = output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state, ...rest] = line.split(/\s+/)
      const meta = rest.join(' ')
      const isEmulator = serial.startsWith('emulator-') || meta.includes('emulator')
      return { serial, state, isEmulator }
    })
    .filter(({ state, isEmulator }) => state === 'device' && !isEmulator)

  if (devices.length === 0) {
    console.error('[android] 未检测到 USB 真机。请确认 USB 调试已开启且已授权。')
    console.error('            若同时开着 emulator，本脚本会自动忽略 emulator。')
    process.exit(1)
  }

  if (devices.length > 1) {
    console.warn('[android] 检测到多台真机，使用:', devices[0].serial)
  }

  return devices[0].serial
}

function isDevClientInstalled(adb, serial, packageName) {
  const result = spawnSync(adb, ['-s', serial, 'shell', 'pm', 'path', packageName], {
    encoding: 'utf8',
    env: withAndroidEnv({ ANDROID_SERIAL: serial }),
  })
  return result.status === 0 && result.stdout.includes('package:')
}

function setupAdbReverse(adb, serial) {
  setupMetroReverse(adb, serial, metroPort)
  console.log(`[android] adb reverse tcp:${metroPort} 已设置`)
}

function ensureDevClientOnDevice(serial) {
  const adb = resolveAdb()
  const installed = isDevClientInstalled(adb, serial, androidPackage)

  if (attachOnly && !installed) {
    console.error(`[android] 真机未安装 Dev Client（${androidPackage}）。`)
    console.error('        请先运行: pnpm android:device:build')
    console.error('        或完整流程: pnpm android:device')
    process.exit(1)
  }

  if (forceRebuild) {
    console.log('[android] --rebuild：强制重新构建 Dev Client')
  } else if (!installed) {
    console.log(`[android] 真机未安装 Dev Client，开始构建...`)
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
  run('npx', [
    'expo',
    'start',
    '--dev-client',
    '--android',
    '--port',
    metroPort,
    ...expoStartExtraArgs,
  ], {
    env: { ANDROID_SERIAL: serial },
  })
}

// --- main ---

const adb = resolveAdb()
const serial = getPhysicalDeviceSerial(adb)

if (!attachOnly) {
  ensureDevClientOnDevice(serial)
}

setupAdbReverse(adb, serial)
startMetro(serial)
