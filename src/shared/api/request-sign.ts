import { CryptoDigestAlgorithm, digest, digestStringAsync } from 'expo-crypto'
import { env } from '@/shared/env'

const Encoder = new TextEncoder()
const HMACBlockSize = 64

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(data: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, data)
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const size = arrays.reduce((total, item) => total + item.length, 0)
  const result = new Uint8Array(size)
  let offset = 0
  for (const item of arrays) {
    result.set(item, offset)
    offset += item.length
  }
  return result
}

async function normalizeHMACKey(keyBytes: Uint8Array): Promise<Uint8Array> {
  const normalized =
    keyBytes.length > HMACBlockSize
      ? new Uint8Array(await digest(CryptoDigestAlgorithm.SHA256, keyBytes as unknown as ArrayBuffer))
      : keyBytes

  if (normalized.length === HMACBlockSize) return normalized

  const padded = new Uint8Array(HMACBlockSize)
  padded.set(normalized)
  return padded
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const normalizedKey = await normalizeHMACKey(Encoder.encode(key))
  const innerPad = new Uint8Array(HMACBlockSize)
  const outerPad = new Uint8Array(HMACBlockSize)

  for (let i = 0; i < normalizedKey.length; i++) {
    innerPad[i] = normalizedKey[i]! ^ 0x36
    outerPad[i] = normalizedKey[i]! ^ 0x5c
  }

  const payloadBytes = Encoder.encode(message)
  const innerHash = new Uint8Array(
    await digest(CryptoDigestAlgorithm.SHA256, concatUint8Arrays(innerPad, payloadBytes) as unknown as ArrayBuffer)
  )

  return toHex(await digest(CryptoDigestAlgorithm.SHA256, concatUint8Arrays(outerPad, innerHash) as unknown as ArrayBuffer))
}

function generateNonce(): string {
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  const hex = toHex(bytes.buffer)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export function extractSignPath(path: string): string {
  const q = path.indexOf('?')
  return q === -1 ? path : path.slice(0, q)
}

export async function buildRequestSignHeaders(
  method: string,
  path: string,
  bodyString: string,
): Promise<Record<string, string>> {
  const secret = env.apiSignSecret
  if (!secret) return {}

  const signPath = extractSignPath(path)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const nonce = generateNonce()
  const bodyHash = await sha256Hex(bodyString)
  const signPayload = [
    method.toUpperCase(),
    signPath,
    bodyHash,
    timestamp,
    nonce,
  ].join('\n')
  const sign = await hmacSha256Hex(secret, signPayload)

  return {
    'X-App-Id': env.apiAppId,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Sign': sign,
  }
}
