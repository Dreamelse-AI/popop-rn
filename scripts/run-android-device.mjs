#!/usr/bin/env node
/**
 * 在 USB 连接的 Android 真机上运行，自动排除 emulator。
 * 用法: node scripts/run-android-device.mjs [--no-bundler] [--port 8082]
 */
import { execSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ANDROID_METRO_PORT } from './lib/metro-ports.mjs'
import {
  buildExpoRunAndroidArgs,
  expoRunAndroidEnv,
  resolveExpoDeviceName,
  setupMetroReverse,
} from './lib/android-sdk.mjs'

const METRO_PORT = ANDROID_METRO_PORT
const extraArgs = process.argv.slice(2)

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

const ADB = resolveAdb()

function listPhysicalDevices() {
  let output
  try {
    output = execSync(`${ADB} devices -l`, { encoding: 'utf8' })
  } catch {
    console.error('adb 不可用，请确认 Android SDK platform-tools 已安装并在 PATH 中')
    process.exit(1)
  }

  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('*'))
    .map((line) => {
      const [serial, state, ...rest] = line.split(/\s+/)
      const meta = rest.join(' ')
      const isEmulator = serial.startsWith('emulator-') || meta.includes('emulator')
      return { serial, state, isEmulator }
    })
    .filter(({ state, isEmulator }) => state === 'device' && !isEmulator)
}

const devices = listPhysicalDevices()

if (devices.length === 0) {
  console.error('未检测到 USB 连接的 Android 真机。')
  console.error('请确认：USB 调试已开启、已授权此电脑，且未仅连接 emulator。')
  process.exit(1)
}

if (devices.length > 1) {
  console.warn('检测到多台真机，将使用第一台:', devices[0].serial)
  devices.slice(1).forEach((d) => console.warn('  忽略:', d.serial))
}

const serial = devices[0].serial
const expoDevice = resolveExpoDeviceName(ADB, serial)

try {
  setupMetroReverse(ADB, serial, METRO_PORT)
  console.log(`已设置 adb reverse → Metro ${METRO_PORT}`)
} catch {
  console.warn('adb reverse 设置失败，若无法加载 JS bundle 请手动执行:')
  console.warn(`  adb -s ${serial} reverse tcp:8081 tcp:${METRO_PORT}`)
  console.warn(`  adb -s ${serial} reverse tcp:${METRO_PORT} tcp:${METRO_PORT}`)
}

const args = buildExpoRunAndroidArgs({
  deviceName: expoDevice,
  metroPort: METRO_PORT,
  extraArgs,
})
console.log('运行: npx', args.join(' '))

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    ...expoRunAndroidEnv(serial, METRO_PORT),
  },
})
process.exit(result.status ?? 1)
