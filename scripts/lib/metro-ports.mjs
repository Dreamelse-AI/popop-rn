import { execSync } from 'node:child_process'

/** iOS 模拟器 Metro 端口（默认 8081） */
export const IOS_METRO_PORT = process.env.IOS_METRO_PORT ?? '8081'

/** Android 模拟器 / 真机 Metro 端口（默认 8082，避免与 iOS 冲突） */
export const ANDROID_METRO_PORT = process.env.ANDROID_METRO_PORT ?? '8082'

/**
 * 释放指定端口的 Metro 进程。各平台 dev 脚本只应清理自己的端口。
 */
export function freeMetroPorts(ports) {
  for (const port of ports) {
    try {
      const pids = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean)

      for (const pid of pids) {
        process.kill(Number(pid), 'SIGTERM')
        console.log(`已停止端口 ${port} 上的进程 (pid ${pid})`)
      }
    } catch {
      // 端口未被占用
    }
  }
}
