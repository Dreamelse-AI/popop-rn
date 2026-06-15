#!/usr/bin/env node
/**
 * 释放 Metro 占用的端口，避免切换 iOS 模拟器 / Android 真机时端口冲突。
 */
import { execSync } from 'node:child_process'

const PORTS = [8081, 8082]

for (const port of PORTS) {
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

console.log('Metro 端口已清理')
