#!/usr/bin/env node
/**
 * 释放 Metro 占用的端口。
 * 默认清理 iOS(8081) 与 Android(8082)；也可传入自定义端口。
 */
import { ANDROID_METRO_PORT, IOS_METRO_PORT, freeMetroPorts } from './lib/metro-ports.mjs'

const cliPorts = process.argv.slice(2).filter(Boolean)
const ports = cliPorts.length > 0 ? cliPorts : [IOS_METRO_PORT, ANDROID_METRO_PORT]

freeMetroPorts(ports)
console.log('Metro 端口已清理:', ports.join(', '))
