import { getTosUploadCredential } from '@/generated'
import type { GetTosUploadCredentialResp } from '@/generated/arca_apiComponents'
import * as Crypto from 'expo-crypto'

const PRESIGNED_URL_EXPIRES_SECONDS = 3600

export function resolveTosAssetUrl(url: string): string {
  return url
}

/** 聊天图片展示：保留 blob 预览，TOS 链接走开发代理 */
export function resolveChatImageDisplayUrl(url: string): string {
  if (!url || url.startsWith('blob:')) return url
  return resolveTosAssetUrl(url)
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(data: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data)
}

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  // web-to-rn: expo-crypto 不直接支持 HMAC with raw key bytes
  // 方案1: 使用 crypto-js 库 (npm install crypto-js)
  // 方案2: 使用 react-native-quick-crypto
  // 当前使用 JS 纯实现 fallback
  const { hmacSha256Impl } = await import('./hmac-sha256')
  return hmacSha256Impl(key, message)
}

async function getTosSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const kDate = await hmacSha256(encoder.encode(secretKey), dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, 'tos')
  return hmacSha256(kService, 'request')
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, char =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function getExtensionFromUri(uri: string): string {
  const match = uri.match(/\.(\w+)$/)
  const ext = match?.[1]?.toLowerCase()
  if (ext === 'jpeg') return 'jpg'
  if (ext && ['jpg', 'png', 'webp', 'gif', 'heic', 'heif', 'webm', 'm4a', 'aac', 'mp4', 'ogg'].includes(ext)) {
    return ext
  }
  return 'jpg'
}

function buildObjectKey(uri: string, prefix: string): string {
  const ext = getExtensionFromUri(uri)
  return `${prefix}/${Date.now()}-${Crypto.randomUUID()}.${ext}`
}

function normalizeTosEndpointHost(endpoint: string): string {
  return endpoint
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/\.ibytepluses\.com$/i, '.bytepluses.com')
}

function buildTosHost(credential: GetTosUploadCredentialResp): string {
  const endpoint = normalizeTosEndpointHost(credential.endpoint)
  return `${credential.bucket}.${endpoint}`
}

function buildPublicUrl(credential: GetTosUploadCredentialResp, objectKey: string): string {
  return `https://${buildTosHost(credential)}/${objectKey}`
}

function resolvePresignedSigningRegion(credential: GetTosUploadCredentialResp): string {
  const endpointHost = normalizeTosEndpointHost(credential.endpoint).split('.')[0] ?? ''
  if (endpointHost.startsWith('tos-')) return endpointHost
  if (credential.region.startsWith('tos-')) return credential.region
  return `tos-${credential.region}`
}

function buildCanonicalQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map(key => `${encodeRfc3986(key)}=${encodeRfc3986(params[key]!)}`)
    .join('&')
}

async function signPresignedPutUrl(
  credential: GetTosUploadCredentialResp,
  objectKey: string,
  expiresIn = PRESIGNED_URL_EXPIRES_SECONDS,
): Promise<string> {
  const host = buildTosHost(credential)
  const now = new Date()
  const requestDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = requestDate.slice(0, 8)
  const signingRegion = resolvePresignedSigningRegion(credential)
  const credentialScope = `${dateStamp}/${signingRegion}/tos/request`
  const canonicalUri = `/${objectKey.split('/').map(encodeRfc3986).join('/')}`

  const queryParams: Record<string, string> = {
    'X-Tos-Algorithm': 'TOS4-HMAC-SHA256',
    'X-Tos-Credential': `${credential.access_key_id}/${credentialScope}`,
    'X-Tos-Date': requestDate,
    'X-Tos-Expires': String(expiresIn),
    'X-Tos-SignedHeaders': 'host',
    'X-Tos-Security-Token': credential.session_token,
  }

  const canonicalQueryString = buildCanonicalQueryString(queryParams)
  const canonicalHeaders = `host:${host}\n`
  const signedHeaders = 'host'
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')
  const stringToSign = [
    'TOS4-HMAC-SHA256',
    requestDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join('\n')
  const signingKey = await getTosSigningKey(
    credential.secret_access_key,
    dateStamp,
    signingRegion,
  )
  const signature = toHex(await hmacSha256(signingKey, stringToSign))
  const signedQuery = `${canonicalQueryString}&X-Tos-Signature=${signature}`

  return `https://${host}${canonicalUri}?${signedQuery}`
}

export type TosUploadOptions = {
  prefix?: string
}

export type TosImageUploadResult = {
  url: string
  bucket: string
  objectKey: string
}

// web-to-rn: RN 中使用 fetch 上传本地文件，RN 的 fetch 原生支持 file URI
async function uploadToTos(
  fileUri: string,
  { prefix = 'chat-backgrounds' }: TosUploadOptions = {},
): Promise<TosImageUploadResult> {
  const credential = await getTosUploadCredential({})
  const objectKey = buildObjectKey(fileUri, prefix)
  const presignedUrl = await signPresignedPutUrl(credential, objectKey)

  // RN fetch 支持直接传 file URI 作为 body（通过 FormData 或直接 blob）
  const response = await fetch(fileUri)
  const fileBlob = await response.blob()

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: fileBlob,
  })

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '')
    throw new Error(`TOS upload failed with status ${uploadResponse.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
  }

  return {
    url: buildPublicUrl(credential, objectKey),
    bucket: credential.bucket,
    objectKey,
  }
}

export async function uploadImageToTosWithMeta(
  fileUri: string,
): Promise<TosImageUploadResult> {
  return uploadToTos(fileUri, { prefix: 'chat-backgrounds' })
}

export async function uploadPersonaAvatarToTos(
  fileUri: string,
): Promise<TosImageUploadResult> {
  return uploadToTos(fileUri, { prefix: 'user-persona-avatars' })
}

export async function uploadImageToTos(fileUri: string): Promise<string> {
  const result = await uploadImageToTosWithMeta(fileUri)
  return result.url
}

export async function uploadAudioToTos(fileUri: string): Promise<string> {
  const result = await uploadToTos(fileUri, { prefix: 'chat-voice' })
  return result.url
}
