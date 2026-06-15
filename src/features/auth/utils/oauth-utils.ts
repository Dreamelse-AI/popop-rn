import * as Crypto from 'expo-crypto'

export function generateNonce(length = 32): string {
  const array = Crypto.getRandomBytes(length)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256Hash(message: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, message)
}
