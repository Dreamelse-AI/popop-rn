#!/usr/bin/env node
/**
 * 在 Android 模拟器上构建并安装 Dev Client，自动排除 USB 真机。
 * 用法: node scripts/run-android-emulator.mjs [--no-bundler]
 */
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ANDROID_METRO_PORT } from './lib/metro-ports.mjs'
import {
  DEFAULT_AVD,
  buildExpoRunAndroidArgs,
  expoRunAndroidEnv,
  isEmulatorBooted,
  listEmulatorSerials,
  resolveAdb,
  resolveAndroidHome,
  resolveExpoDeviceName,
  setupMetroReverse,
  sleep,
  withAndroidEnv,
} from './lib/android-sdk.mjs'

const appRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const metroPort = ANDROID_METRO_PORT
const avdName = process.env.ANDROID_AVD ?? DEFAULT_AVD
const extraArgs = process.argv.slice(2)

function runOrExit(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: appRoot,
    stdio: 'inherit',
    shell: false,
    env: withAndroidEnv(env),
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const sdkRoot = resolveAndroidHome()
if (!sdkRoot) {
  console.error('[android] 未找到 Android SDK')
  process.exit(1)
}

const adb = resolveAdb(sdkRoot)
let serials = listEmulatorSerials(adb)

if (serials.length === 0) {
  console.log(`[android] 模拟器未运行，正在启动 ${avdName}...`)
  runOrExit('node', [join(appRoot, 'scripts/android-emulator.mjs'), '--wait', avdName])
  serials = listEmulatorSerials(adb)
}

if (serials.length === 0) {
  console.error('[android] 未检测到模拟器。请先运行: pnpm android:emu')
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

setupMetroReverse(adb, serial, metroPort)
const expoDevice = resolveExpoDeviceName(adb, serial)
console.log(`[android] Expo 设备名: ${expoDevice} (adb: ${serial})`)

const args = buildExpoRunAndroidArgs({
  deviceName: expoDevice,
  metroPort,
  extraArgs: extraArgs.length > 0 ? extraArgs : ['--no-bundler'],
})
console.log('[android] 运行: npx', args.join(' '))

const result = spawnSync('npx', args, {
  cwd: appRoot,
  stdio: 'inherit',
  shell: false,
  env: withAndroidEnv(expoRunAndroidEnv(serial, metroPort)),
})
process.exit(result.status ?? 1)
