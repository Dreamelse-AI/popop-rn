import { getTosUploadCredential } from '@/generated'
import type { GetTosUploadCredentialResp, StorageObject } from '@/generated/arca_apiComponents'
import { File as ExpoFile } from 'expo-file-system'
import { digest, CryptoDigestAlgorithm } from 'expo-crypto'

import { randomUUID } from '@/shared/lib/random-uuid'

import { normalizeAssetUrl } from '@/shared/lib/normalize-asset-url'

/** STS AssumeRole 合法区间 900–3600s */
const TOS_CREDENTIAL_EXPIRES_SECONDS = 3600

/** 公有 CDN 域名 */
const PUBLIC_CDN_HOST = 'cdn-prod-i18n-public.popop.ai'

const CREDENTIAL_REFRESH_BUFFER_MS = 60_000

let cachedCredential: { credential: GetTosUploadCredentialResp; expiresAt: number } | null = null
let credentialInflight: Promise<GetTosUploadCredentialResp> | null = null

async function acquireCredential(expiresIn: number): Promise<GetTosUploadCredentialResp> {
  if (cachedCredential && Date.now() < cachedCredential.expiresAt) {
    return cachedCredential.credential
  }

  if (credentialInflight) return credentialInflight

  credentialInflight = getTosUploadCredential({
    expires_in: expiresIn,
    use_public: true,
  }).then(cred => {
    cachedCredential = {
      credential: cred,
      expiresAt: Date.now() + expiresIn * 1000 - CREDENTIAL_REFRESH_BUFFER_MS,
    }
    credentialInflight = null
    return cred
  }).catch(err => {
    credentialInflight = null
    throw err
  })

  return credentialInflight
}

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

function buildCdnUrl(objectKey: string): string {
  const path = objectKey.split('/').map(encodeURIComponent).join('/')
  return `https://${PUBLIC_CDN_HOST}/${path}`
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

export type TosUploadOptions = {
  prefix?: string
  expiresIn?: number
  objectType?: string
}

export type TosImageUploadResult = {
  url: string
  bucket: string
  objectKey: string
  storageObject: StorageObject
}

async function hmacSha1Base64(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  let keyBytes = enc.encode(key)

  const BLOCK_SIZE = 64
  if (keyBytes.length > BLOCK_SIZE) {
    const hashed = await digest(CryptoDigestAlgorithm.SHA1, keyBytes)
    keyBytes = new Uint8Array(hashed)
  }

  const paddedKey = new Uint8Array(BLOCK_SIZE)
  paddedKey.set(keyBytes)

  const ipad = new Uint8Array(BLOCK_SIZE)
  const opad = new Uint8Array(BLOCK_SIZE)
  for (let i = 0; i < BLOCK_SIZE; i++) {
    ipad[i] = paddedKey[i] ^ 0x36
    opad[i] = paddedKey[i] ^ 0x5c
  }

  const msgBytes = enc.encode(message)
  const inner = new Uint8Array(BLOCK_SIZE + msgBytes.length)
  inner.set(ipad)
  inner.set(msgBytes, BLOCK_SIZE)
  const innerHash = new Uint8Array(await digest(CryptoDigestAlgorithm.SHA1, inner))

  const outer = new Uint8Array(BLOCK_SIZE + innerHash.length)
  outer.set(opad)
  outer.set(innerHash, BLOCK_SIZE)
  const hmac = new Uint8Array(await digest(CryptoDigestAlgorithm.SHA1, outer))

  let binary = ''
  for (let i = 0; i < hmac.length; i++) {
    binary += String.fromCharCode(hmac[i])
  }
  return btoa(binary)
}

function buildOssSignedUrl(params: {
  accessKeyId: string
  accessKeySecret: string
  stsToken: string
  bucket: string
  endpoint: string
  objectKey: string
  contentType: string
  expires: number
}): Promise<string> {
  const { accessKeyId, accessKeySecret, stsToken, bucket, endpoint, objectKey, contentType, expires } = params
  const host = endpoint.replace(/^https?:\/\//, '')
  const resource = `/${bucket}/${objectKey}`
  const stringToSign = `PUT\n\n${contentType}\n${expires}\nx-oss-security-token:${stsToken}\n${resource}`

  return hmacSha1Base64(accessKeySecret, stringToSign).then(signature => {
    const query = [
      `OSSAccessKeyId=${encodeURIComponent(accessKeyId)}`,
      `Expires=${expires}`,
      `Signature=${encodeURIComponent(signature)}`,
      `security-token=${encodeURIComponent(stsToken)}`,
    ].join('&')
    return `https://${bucket}.${host}/${objectKey}?${query}`
  })
}

/**
 * 上传文件至公有 OSS bucket。
 *
 * 流程：
 * 1. 请求 tos_credential（use_public=true）获取 STS 临时凭证
 * 2. 内联 OSS V1 签名生成 presigned URL（Web Crypto HMAC-SHA1）
 * 3. RN 原生 fetch PUT 上传文件
 * 4. 拼接公有 CDN URL 作为访问地址
 */
async function uploadToTos(
  fileUri: string,
  { prefix = 'popop-fe-user-upload/images', expiresIn, objectType = 'image' }: TosUploadOptions = {},
): Promise<TosImageUploadResult> {
  const credential = await acquireCredential(expiresIn ?? TOS_CREDENTIAL_EXPIRES_SECONDS)
  const objectKey = buildObjectKey(fileUri, prefix)
  const contentType = getContentTypeFromUri(fileUri)

  const expires = Math.floor(Date.now() / 1000) + 600

  const signedUrl = await buildOssSignedUrl({
    accessKeyId: credential.access_key_id,
    accessKeySecret: credential.secret_access_key,
    stsToken: credential.session_token,
    bucket: credential.bucket,
    endpoint: credential.endpoint,
    objectKey,
    contentType,
    expires,
  })

  const file = new ExpoFile(fileUri)
  const fileBytes = await file.bytes()

  const res = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: fileBytes,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`TOS upload failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const cdnUrl = buildCdnUrl(objectKey)
  const requestId = res.headers.get('x-oss-request-id') ?? undefined

  const storageObject: StorageObject = {
    bucket_name: credential.bucket,
    object_key: objectKey,
    object_type: objectType,
    url: cdnUrl,
    request_id: requestId,
  }

  return {
    url: cdnUrl,
    bucket: credential.bucket,
    objectKey,
    storageObject,
  }
}

export async function uploadImageToTosWithMeta(
  fileUri: string,
): Promise<TosImageUploadResult> {
  return uploadToTos(fileUri, { prefix: 'popop-fe-user-upload/images', objectType: 'image' })
}

export async function uploadPersonaAvatarToTos(
  fileUri: string,
): Promise<TosImageUploadResult> {
  return uploadToTos(fileUri, { prefix: 'popop-fe-user-upload/images', objectType: 'image' })
}

export async function uploadImageToTos(fileUri: string): Promise<string> {
  const result = await uploadImageToTosWithMeta(fileUri)
  return result.url
}

export async function uploadAudioToTosWithMeta(
  fileUri: string,
): Promise<TosImageUploadResult> {
  return uploadToTos(fileUri, { prefix: 'popop-fe-user-upload/voice', objectType: 'audio' })
}

export async function uploadAudioToTos(fileUri: string): Promise<string> {
  const result = await uploadAudioToTosWithMeta(fileUri)
  return result.url
}

export async function uploadAiGenImageToTos(fileUri: string): Promise<string> {
  const result = await uploadToTos(fileUri, { prefix: 'popop-fe-user-upload/images', objectType: 'image' })
  return result.url
}
