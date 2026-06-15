// web-to-rn: 纯 JS 实现 HMAC-SHA256
// 方案: 如果性能不满足可替换为 react-native-quick-crypto 或 crypto-js
// 当前使用 js-sha256 风格的纯实现

const encoder = new TextEncoder()

function xorBytes(a: Uint8Array, b: number): Uint8Array {
  const result = new Uint8Array(a.length)
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i]! ^ b
  }
  return result
}

async function sha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  // web-to-rn: 使用 expo-crypto digestAsync (接收 base64)
  // 但 expo-crypto 不支持 raw bytes 输入 → 使用 SubtleCrypto polyfill
  // RN Hermes 环境有全局 crypto.subtle（需 react-native >= 0.74）
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const hash = await globalThis.crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer)
    return new Uint8Array(hash)
  }

  // fallback: 如果 subtle 不可用，抛错提示安装 polyfill
  throw new Error(
    'HMAC-SHA256 requires crypto.subtle. ' +
    'Ensure react-native >= 0.74 or install react-native-quick-crypto.',
  )
}

const BLOCK_SIZE = 64

export async function hmacSha256Impl(key: Uint8Array, message: string): Promise<Uint8Array> {
  let keyBytes = key
  if (keyBytes.length > BLOCK_SIZE) {
    keyBytes = await sha256Bytes(keyBytes)
  }
  if (keyBytes.length < BLOCK_SIZE) {
    const padded = new Uint8Array(BLOCK_SIZE)
    padded.set(keyBytes)
    keyBytes = padded
  }

  const oKeyPad = xorBytes(keyBytes, 0x5c)
  const iKeyPad = xorBytes(keyBytes, 0x36)

  const msgBytes = encoder.encode(message)
  const inner = new Uint8Array(iKeyPad.length + msgBytes.length)
  inner.set(iKeyPad)
  inner.set(msgBytes, iKeyPad.length)
  const innerHash = await sha256Bytes(inner)

  const outer = new Uint8Array(oKeyPad.length + innerHash.length)
  outer.set(oKeyPad)
  outer.set(innerHash, oKeyPad.length)
  return sha256Bytes(outer)
}
