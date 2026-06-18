import { CryptoDigestAlgorithm, digest } from 'expo-crypto'

const encoder = new TextEncoder()
const HMAC_BLOCK_SIZE = 64

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

async function sha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await digest(CryptoDigestAlgorithm.SHA256, data as unknown as ArrayBuffer))
}

async function normalizeHmacKey(key: Uint8Array): Promise<Uint8Array> {
  const normalized =
    key.length > HMAC_BLOCK_SIZE ? await sha256Bytes(key) : key

  if (normalized.length === HMAC_BLOCK_SIZE) return normalized

  const padded = new Uint8Array(HMAC_BLOCK_SIZE)
  padded.set(normalized)
  return padded
}

function toKeyBytes(key: string | Uint8Array): Uint8Array {
  return typeof key === 'string' ? encoder.encode(key) : key
}

export async function hmacSha256Bytes(
  key: string | Uint8Array,
  message: string,
): Promise<Uint8Array> {
  const normalizedKey = await normalizeHmacKey(toKeyBytes(key))
  const innerPad = new Uint8Array(HMAC_BLOCK_SIZE)
  const outerPad = new Uint8Array(HMAC_BLOCK_SIZE)

  for (let i = 0; i < HMAC_BLOCK_SIZE; i++) {
    innerPad[i] = normalizedKey[i]! ^ 0x36
    outerPad[i] = normalizedKey[i]! ^ 0x5c
  }

  const payloadBytes = encoder.encode(message)
  const innerHash = await sha256Bytes(concatUint8Arrays(innerPad, payloadBytes))
  return sha256Bytes(concatUint8Arrays(outerPad, innerHash))
}

export async function hmacSha256Impl(key: Uint8Array, message: string): Promise<Uint8Array> {
  return hmacSha256Bytes(key, message)
}
