#!/usr/bin/env node
/**
 * Android USB 真机开发流程（参考 rn-debug-demo/scripts/dev-android.mjs）
 *
 * 用法:
 *   node scripts/dev-android.mjs           # 构建（如需）+ 启动 Metro + 打开真机
 *   node scripts/dev-android.mjs --attach  # 仅启动 Metro（Dev Client 已安装时）
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const appRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const androidDir = join(appRoot, 'android')
const metroPort = process.env.METRO_PORT ?? '8081'
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

function resolveAdb() {
  const candidates = [
    process.env.ANDROID_HOME && join(process.env.ANDROID_HOME, 'platform-tools', 'adb'),
    process.env.ANDROID_SDK_ROOT && join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb'),
    process.env.HOME && join(process.env.HOME, 'Library/Android/sdk/platform-tools/adb'),
  ].filter(Boolean)

  for (const adb of candidates) {
    if (existsSync(adb)) return adb
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

function ensureNativeBuild() {
  if (existsSync(androidDir)) return

  console.log('[android] 首次 — 运行 expo run:android 构建...\n')
  const adb = resolveAdb()
  const serial = getPhysicalDeviceSerial(adb)
  setupAdbReverse(adb, serial)
  run('npx', ['expo', 'run:android', '--device', serial, '-p', metroPort, '--no-bundler'])
}

function setupAdbReverse(adb, serial) {
  const result = spawnSync(adb, ['-s', serial, 'reverse', `tcp:${metroPort}`, `tcp:${metroPort}`], {
    stdio: 'inherit',
  })
  if (result.status === 0) {
    console.log(`[android] adb reverse tcp:${metroPort} 已设置`)
  } else {
    console.warn(`[android] adb reverse 失败，请手动执行:`)
    console.warn(`          ${adb} -s ${serial} reverse tcp:${metroPort} tcp:${metroPort}`)
  }
}

function startMetro() {
  console.log(`\n[android] 启动 Metro (port ${metroPort})...\n`)
  run('npx', ['expo', 'start', '--dev-client', '--android', '--port', metroPort])
}

// --- main ---

if (!attachOnly) {
  ensureNativeBuild()
}

const adb = resolveAdb()
const serial = getPhysicalDeviceSerial(adb)
setupAdbReverse(adb, serial)
startMetro()
