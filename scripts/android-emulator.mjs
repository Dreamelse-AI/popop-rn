#!/usr/bin/env node
/**
 * 命令行启动 Android 模拟器
 *
 * 用法:
 *   node scripts/android-emulator.mjs              # 启动默认 AVD
 *   node scripts/android-emulator.mjs --list       # 列出 AVD
 *   node scripts/android-emulator.mjs --wait       # 启动并等待开机完成
 *   node scripts/android-emulator.mjs Pixel_8      # 启动指定 AVD
 */
import { spawn } from 'node:child_process'
import {
  DEFAULT_AVD,
  isEmulatorBooted,
  listAvds,
  listEmulatorSerials,
  resolveAdb,
  resolveAndroidHome,
  resolveEmulator,
  sleep,
  withAndroidEnv,
} from './lib/android-sdk.mjs'

const args = process.argv.slice(2)
const listOnly = args.includes('--list')
const waitForBoot = args.includes('--wait')
const avdName = args.find((arg) => !arg.startsWith('--')) ?? process.env.ANDROID_AVD ?? DEFAULT_AVD

const sdkRoot = resolveAndroidHome()
if (!sdkRoot) {
  console.error('[android] 未找到 Android SDK。请确认 ANDROID_HOME 已配置。')
  process.exit(1)
}

const emulatorPath = resolveEmulator(sdkRoot)
if (!emulatorPath) {
  console.error('[android] 未找到 emulator 可执行文件。')
  process.exit(1)
}

const avds = listAvds(emulatorPath)

if (listOnly) {
  if (avds.length === 0) {
    console.log('（无 AVD，请先运行: pnpm android:emu:setup）')
  } else {
    for (const avd of avds) console.log(avd)
  }
  process.exit(0)
}

if (!avds.includes(avdName)) {
  console.error(`[android] 找不到 AVD「${avdName}」。`)
  console.error('        可用:', avds.join(', ') || '（无）')
  console.error('        初始化: pnpm android:emu:setup')
  process.exit(1)
}

const adb = resolveAdb(sdkRoot)
const running = listEmulatorSerials(adb)

if (running.length > 0) {
  console.log('[android] 模拟器已在运行:', running.join(', '))
  if (waitForBoot) {
    for (const serial of running) {
      if (!isEmulatorBooted(adb, serial)) {
        console.log('[android] 等待模拟器开机...')
        waitUntilBooted(adb, serial)
      }
    }
  }
  process.exit(0)
}

console.log(`[android] 启动模拟器 ${avdName}...`)
const child = spawn(emulatorPath, ['-avd', avdName, '-gpu', 'host'], {
  detached: true,
  stdio: 'ignore',
  env: withAndroidEnv(),
})
child.unref()

if (waitForBoot) {
  console.log('[android] 等待 adb 连接...')
  const serial = waitForAnyEmulator(adb)
  console.log('[android] 等待开机完成...')
  waitUntilBooted(adb, serial)
  console.log('[android] 模拟器已就绪:', serial)
}

function waitForAnyEmulator(adbPath, timeoutMs = 180_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const serials = listEmulatorSerials(adbPath)
    if (serials.length > 0) return serials[0]
    sleep(2000)
  }
  throw new Error('等待模拟器 adb 连接超时')
}

function waitUntilBooted(adbPath, serial, timeoutMs = 180_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (isEmulatorBooted(adbPath, serial)) return
    sleep(2000)
  }
  throw new Error('模拟器开机超时')
}
