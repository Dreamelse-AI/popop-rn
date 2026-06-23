import { getTosUploadCredential } from '@/generated'
import type { GetTosUploadCredentialResp } from '@/generated/arca_apiComponents'
import * as Crypto from 'expo-crypto'
import { File } from 'expo-file-system'

import { randomUUID } from '@/shared/lib/random-uuid'

import { hmacSha256Bytes } from './hmac-sha256'

import { normalizeAssetUrl } from '@/shared/lib/normalize-asset-url'

const PRESIGNED_URL_EXPIRES_SECONDS = 3600

export function resolveTosAssetUrl(url: string): string {
  return normalizeAssetUrl(url)
}

/** 聊天图片展示：本地 URI 原样返回，远程 OSS 链接做 hostname 修正 */
export function resolveChatImageDisplayUrl(url: string): string {
  if (!url) return url
  if (
    url.startsWith('blob:') ||
    url.startsWith('file://') ||
    url.startsWith('ph://') ||
    url.startsWith('content://') ||
    url.startsWith('assets-library://')
  ) {
    return url
  }
  return normalizeAssetUrl(url)
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(data: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data)
}

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  return hmacSha256Bytes(key, message)
}

/** 阿里云 OSS 签名：OSS4-HMAC-SHA256 */
async function getOssSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
): Promise<Uint8Array> {
  const kDate = await hmacSha256Bytes(`aliyun_v4${secretKey}`, dateStamp)
  const kRegion = await hmacSha256Bytes(kDate, region)
  const kService = await hmacSha256Bytes(kRegion, 'oss')
  return hmacSha256Bytes(kService, 'aliyun_v4_request')
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
  return `${prefix}/${Date.now()}-${randomUUID()}.${ext}`
}

/** 后端返回的 endpoint 格式：https://oss-ap-northeast-1.aliyuncs.com */
function normalizeOssEndpointHost(endpoint: string): string {
  return endpoint
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
}

function buildOssHost(credential: GetTosUploadCredentialResp): string {
  const endpoint = normalizeOssEndpointHost(credential.endpoint)
  return `${credential.bucket}.${endpoint}`
}

function resolveOssSigningRegion(credential: GetTosUploadCredentialResp): string {
  return credential.region
}

function buildCanonicalQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map(key => {
      const value = params[key]!
      // 阿里云 OSS V4: 空值参数不带等号
      return value === '' ? encodeRfc3986(key) : `${encodeRfc3986(key)}=${encodeRfc3986(value)}`
    })
    .join('&')
}

/**
 * 阿里云 OSS 预签名 URL：签名在 query 中，无需 Authorization 头，
 * 降低 CORS 预检复杂度。
 */
async function signPresignedPutUrl(
  credential: GetTosUploadCredentialResp,
  objectKey: string,
  contentType: string,
  expiresIn = PRESIGNED_URL_EXPIRES_SECONDS,
): Promise<string> {
  const host = buildOssHost(credential)
  const now = new Date()
  const requestDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = requestDate.slice(0, 8)
  const signingRegion = resolveOssSigningRegion(credential)
  const credentialScope = `${dateStamp}/${signingRegion}/oss/aliyun_v4_request`
  // 实际请求的 URI（不含 bucket）
  const requestUri = `/${objectKey.split('/').map(encodeRfc3986).join('/')}`
  // 签名用的 Canonical URI（需要包含 bucket 前缀）
  const canonicalUri = `/${credential.bucket}${requestUri}`

  const queryParams: Record<string, string> = {
    'x-oss-signature-version': 'OSS4-HMAC-SHA256',
    'x-oss-credential': `${credential.access_key_id}/${credentialScope}`,
    'x-oss-date': requestDate,
    'x-oss-expires': String(expiresIn),
    'x-oss-signed-headers': 'content-type',
    'x-oss-security-token': credential.session_token,
  }

  const canonicalQueryString = buildCanonicalQueryString(queryParams)
  // Canonical Request 格式：
  // HTTP Verb + \n + Canonical URI + \n + Canonical Query String + \n +
  // Canonical Headers + \n + Signed Headers + \n + Hashed Payload
  const canonicalHeaders = `content-type:${contentType}\n`
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    '',
    'UNSIGNED-PAYLOAD',
  ].join('\n')
  const stringToSign = [
    'OSS4-HMAC-SHA256',
    requestDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join('\n')
  const signingKey = await getOssSigningKey(
    credential.secret_access_key,
    dateStamp,
    signingRegion,
  )
  const signature = toHex(await hmacSha256(signingKey, stringToSign))
  const signedQuery = `${canonicalQueryString}&x-oss-signature=${signature}`

  // URL 使用 requestUri（不含 bucket），签名使用 canonicalUri（含 bucket）
  return `https://${host}${requestUri}?${signedQuery}`
}

/**
 * 生成预签名 GET URL，用于访问私有 bucket 中的对象
 * 阿里云 OSS V4 签名格式参考 ali-oss SDK signatureUrlV4 实现
 */
async function signPresignedGetUrl(
  credential: GetTosUploadCredentialResp,
  objectKey: string,
  expiresIn = PRESIGNED_URL_EXPIRES_SECONDS,
): Promise<string> {
  const host = buildOssHost(credential)
  const now = new Date()
  const requestDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = requestDate.slice(0, 8)
  const signingRegion = resolveOssSigningRegion(credential)
  const credentialScope = `${dateStamp}/${signingRegion}/oss/aliyun_v4_request`
  // Canonical URI: /bucketName/objectKey（签名用）
  const canonicalUri = `/${credential.bucket}/${objectKey.split('/').map(encodeRfc3986).join('/')}`
  // Request URI: /objectKey（实际请求用，因为 bucket 已经在 host 中）
  const requestUri = `/${objectKey.split('/').map(encodeRfc3986).join('/')}`

  // 构建查询参数（不包含 x-oss-additional-headers，因为 GET 不签 header）
  const queryParams: Record<string, string> = {
    'x-oss-credential': `${credential.access_key_id}/${credentialScope}`,
    'x-oss-date': requestDate,
    'x-oss-expires': String(expiresIn),
    'x-oss-security-token': credential.session_token,
    'x-oss-signature-version': 'OSS4-HMAC-SHA256',
  }

  const canonicalQueryString = buildCanonicalQueryString(queryParams)

  // Canonical Request 格式（6 部分，用 \n 分隔）：
  // 1. HTTP Verb
  // 2. Canonical URI
  // 3. Canonical Query String
  // 4. Canonical Headers（GET 不签 header 时为空，但需要换行）
  // 5. Additional Headers（GET 不签 header 时为空）
  // 6. Hashed Payload
  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQueryString,
    '', // Canonical Headers（空）
    '', // Additional Headers（空）
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const canonicalRequestHash = await sha256(canonicalRequest)
  const stringToSign = [
    'OSS4-HMAC-SHA256',
    requestDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n')

  const signingKey = await getOssSigningKey(
    credential.secret_access_key,
    dateStamp,
    signingRegion,
  )
  const signature = toHex(await hmacSha256(signingKey, stringToSign))

  // 最终 URL 使用 requestUri（不含 bucket）
  const signedQuery = `${canonicalQueryString}&x-oss-signature=${signature}`
  return `https://${host}${requestUri}?${signedQuery}`
}

export type TosUploadOptions = {
  prefix?: string
  expiresIn?: number
}

export type TosImageUploadResult = {
  url: string
  bucket: string
  objectKey: string
}

// RN：用 expo-file-system 读取本地相册 URI，避免 fetch(file://) 在 iOS 上不稳定
async function readUploadBody(fileUri: string): Promise<Uint8Array> {
  return new File(fileUri).bytes()
}

function getContentTypeFromUri(uri: string): string {
  const ext = getExtensionFromUri(uri)
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
    heif: 'image/heif',
    webm: 'audio/webm',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    mp4: 'video/mp4',
    ogg: 'audio/ogg',
  }
  return mimeMap[ext] ?? 'application/octet-stream'
}

async function uploadToTos(
  fileUri: string,
  { prefix = 'chat-backgrounds', expiresIn }: TosUploadOptions = {},
): Promise<TosImageUploadResult> {
  const credential = await getTosUploadCredential(expiresIn ? { expires_in: expiresIn } : {})
  const objectKey = buildObjectKey(fileUri, prefix)
  const contentType = getContentTypeFromUri(fileUri)
  const presignedUrl = await signPresignedPutUrl(credential, objectKey, contentType)
  const fileBytes = await readUploadBody(fileUri)
  const uploadBody = fileBytes.buffer.slice(
    fileBytes.byteOffset,
    fileBytes.byteOffset + fileBytes.byteLength,
  ) as ArrayBuffer

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: uploadBody,
  })

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '')
    throw new Error(`OSS upload failed with status ${uploadResponse.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
  }

  // 私有 bucket 需要生成预签名 URL 才能访问
  const signedGetUrl = await signPresignedGetUrl(credential, objectKey)

  return {
    url: signedGetUrl,
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

export async function uploadAiGenImageToTos(fileUri: string): Promise<string> {
  const result = await uploadToTos(fileUri, { prefix: 'ai-gen-images', expiresIn: 3600 })
  return result.url
}
