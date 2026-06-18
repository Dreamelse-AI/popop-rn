import { existsSync, mkdirSync, symlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

export const DEFAULT_AVD = 'popop_api36'
export const DEFAULT_API = 36
export const DEFAULT_SYSTEM_IMAGE = `system-images;android-${DEFAULT_API};google_apis;arm64-v8a`
export const DEFAULT_DEVICE_PROFILE = 'pixel_8'

const BREW_CMDLINE_TOOLS = '/opt/homebrew/share/android-commandlinetools/cmdline-tools/latest'

export function resolveAndroidHome() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    join(homedir(), 'Library/Android/sdk'),
  ].filter(Boolean)

  for (const root of candidates) {
    if (existsSync(join(root, 'platform-tools', 'adb'))) return root
  }

  return null
}

export function resolveJavaHome() {
  const candidates = [
    process.env.JAVA_HOME,
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
  ].filter(Boolean)

  for (const home of candidates) {
    if (existsSync(join(home, 'bin', 'java'))) return home
  }

  return null
}

function resolveTool(sdkRoot, ...segments) {
  const path = join(sdkRoot, ...segments)
  return existsSync(path) ? path : null
}

export function resolveAdb(sdkRoot = resolveAndroidHome()) {
  if (!sdkRoot) return 'adb'
  return resolveTool(sdkRoot, 'platform-tools', 'adb') ?? 'adb'
}

export function resolveEmulator(sdkRoot = resolveAndroidHome()) {
  if (!sdkRoot) return null
  return resolveTool(sdkRoot, 'emulator', 'emulator')
}

export function resolveSdkmanager(sdkRoot = resolveAndroidHome()) {
  if (!sdkRoot) return null
  return (
    resolveTool(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager')
    ?? resolveTool(sdkRoot, 'tools', 'bin', 'sdkmanager')
  )
}

export function resolveAvdmanager(sdkRoot = resolveAndroidHome()) {
  if (!sdkRoot) return null
  return (
    resolveTool(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'avdmanager')
    ?? resolveTool(sdkRoot, 'tools', 'bin', 'avdmanager')
  )
}

export function withAndroidEnv(extra = {}) {
  const sdkRoot = resolveAndroidHome()
  const javaHome = resolveJavaHome()
  const pathParts = []

  if (sdkRoot) {
    pathParts.push(
      join(sdkRoot, 'emulator'),
      join(sdkRoot, 'platform-tools'),
      join(sdkRoot, 'cmdline-tools', 'latest', 'bin'),
    )
  }

  return {
    ...process.env,
    ...(sdkRoot ? { ANDROID_HOME: sdkRoot, ANDROID_SDK_ROOT: sdkRoot } : {}),
    ...(javaHome ? { JAVA_HOME: javaHome } : {}),
    PATH: [...pathParts, process.env.PATH].filter(Boolean).join(':'),
    ...extra,
  }
}

export function ensureCmdlineTools(sdkRoot) {
  const target = join(sdkRoot, 'cmdline-tools', 'latest')
  if (existsSync(join(target, 'bin', 'sdkmanager'))) return target

  if (!existsSync(BREW_CMDLINE_TOOLS)) {
    console.error('[android] 未找到 cmdline-tools。请先安装:')
    console.error('        brew install --cask android-commandlinetools')
    process.exit(1)
  }

  mkdirSync(join(sdkRoot, 'cmdline-tools'), { recursive: true })
  symlinkSync(BREW_CMDLINE_TOOLS, target)
  console.log('[android] 已链接 Homebrew cmdline-tools →', target)
  return target
}

export function listAvds(emulatorPath) {
  const result = spawnSync(emulatorPath, ['-list-avds'], {
    encoding: 'utf8',
    env: withAndroidEnv(),
  })

  if (result.status !== 0) {
    console.error(result.stderr || '[android] emulator -list-avds 失败')
    process.exit(result.status ?? 1)
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function listEmulatorSerials(adb = resolveAdb()) {
  const result = spawnSync(adb, ['devices', '-l'], { encoding: 'utf8' })
  const output = result.stdout ?? ''

  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state] = line.split(/\s+/)
      return { serial, state, isEmulator: serial.startsWith('emulator-') }
    })
    .filter(({ state, isEmulator }) => state === 'device' && isEmulator)
    .map(({ serial }) => serial)
}

export function isEmulatorBooted(adb, serial) {
  const result = spawnSync(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed'], {
    encoding: 'utf8',
  })
  return result.stdout?.trim() === '1'
}

export function sleep(ms) {
  spawnSync('sleep', [String(Math.ceil(ms / 1000))])
}

/**
 * Expo `run:android --device` 需要设备名称（AVD 名 / model），不是 adb serial。
 * 例如 serial `emulator-5554` → `popop_api36`
 */
export function resolveExpoDeviceName(adb, serial) {
  if (serial.startsWith('emulator-')) {
    const result = spawnSync(adb, ['-s', serial, 'emu', 'avd', 'name'], {
      encoding: 'utf8',
      env: withAndroidEnv({ ANDROID_SERIAL: serial }),
    })
    const avdName = result.stdout
      ?.split('\n')
      .map((line) => line.trim())
      .find((line) => line && line !== 'OK')
    if (avdName) return avdName
  }

  const listing = spawnSync(adb, ['devices', '-l'], { encoding: 'utf8' })
  for (const line of listing.stdout?.split('\n') ?? []) {
    if (!line.startsWith(serial)) continue
    const model = line.match(/model:(\S+)/)?.[1]
    if (model) return model
  }

  return serial
}

/** `--no-bundler` 时不能传 `-p`，否则 Expo 会报错 */
export function buildExpoRunAndroidArgs({ deviceName, metroPort, extraArgs = [] }) {
  const args = ['expo', 'run:android', '--device', deviceName]
  const skipBundler = extraArgs.includes('--no-bundler')
  if (!skipBundler) {
    args.push('-p', metroPort)
  }
  args.push(...extraArgs)
  return args
}

export function expoRunAndroidEnv(serial, metroPort) {
  return {
    ANDROID_SERIAL: serial,
    RCT_METRO_PORT: metroPort,
  }
}

/** 兼容 Dev Client 内嵌 8081、Metro 跑在 8082 的情况 */
export function setupMetroReverse(adb, serial, metroPort) {
  const devicePorts = new Set([metroPort, '8081'])
  for (const devicePort of devicePorts) {
    spawnSync(adb, ['-s', serial, 'reverse', `tcp:${devicePort}`, `tcp:${metroPort}`], {
      stdio: 'inherit',
      env: withAndroidEnv({ ANDROID_SERIAL: serial }),
    })
  }
}
