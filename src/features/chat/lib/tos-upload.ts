import { getTosUploadCredential } from '@/generated'
import type { GetTosUploadCredentialResp, StorageObject } from '@/generated/arca_apiComponents'
import { File } from 'expo-file-system'

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

async function readUploadBody(fileUri: string): Promise<Uint8Array> {
  return new File(fileUri).bytes()
}

function getOSSClient(config: {
  accessKeyId: string
  accessKeySecret: string
  stsToken: string
  bucket: string
  endpoint: string
  secure: boolean
}) {
  const OSS = require('ali-oss')
  return new OSS(config)
}

/**
 * 上传文件至公有 OSS bucket（ali-oss SDK 处理签名）。
 *
 * 流程：
 * 1. 请求 tos_credential（use_public=true）获取 STS 临时凭证（同一有效期内复用）
 * 2. ali-oss SDK 上传（内部处理签名）
 * 3. 拼接公有 CDN URL 作为访问地址
 */
async function uploadToTos(
  fileUri: string,
  { prefix = 'popop-fe-user-upload/images', expiresIn, objectType = 'image' }: TosUploadOptions = {},
): Promise<TosImageUploadResult> {
  const credential = await acquireCredential(expiresIn ?? TOS_CREDENTIAL_EXPIRES_SECONDS)
  const objectKey = buildObjectKey(fileUri, prefix)
  const contentType = getContentTypeFromUri(fileUri)

  const client = getOSSClient({
    accessKeyId: credential.access_key_id,
    accessKeySecret: credential.secret_access_key,
    stsToken: credential.session_token,
    bucket: credential.bucket,
    endpoint: credential.endpoint,
    secure: true,
  })

  const fileBytes = await readUploadBody(fileUri)
  const uploadBody = fileBytes.buffer.slice(
    fileBytes.byteOffset,
    fileBytes.byteOffset + fileBytes.byteLength,
  ) as ArrayBuffer

  let result: { res?: { headers?: Record<string, string> } }
  try {
    result = await client.put(objectKey, new Blob([uploadBody], { type: contentType }), {
      headers: { 'Content-Type': contentType },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`OSS upload failed: ${message}`)
  }

  const cdnUrl = buildCdnUrl(objectKey)
  const requestId = result.res?.headers?.['x-oss-request-id'] as string | undefined

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
