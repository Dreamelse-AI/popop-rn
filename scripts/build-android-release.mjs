#!/usr/bin/env node
/**
 * 仅构建 release APK，不启动 Metro、不安装到设备。
 * 输出: android/app/build/outputs/apk/release/app-release.apk
 */
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { withAndroidEnv } from './lib/android-sdk.mjs'

const appRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const gradlew = join(appRoot, 'android', process.platform === 'win32' ? 'gradlew.bat' : 'gradlew')
const apkPath = join(appRoot, 'android/app/build/outputs/apk/release/app-release.apk')

const result = spawnSync(gradlew, ['assembleRelease'], {
  cwd: join(appRoot, 'android'),
  stdio: 'inherit',
  shell: false,
  env: withAndroidEnv(),
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log(`\n[android] Release APK: ${apkPath}\n`)
