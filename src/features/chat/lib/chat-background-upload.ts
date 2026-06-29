import { auditImage, getImageMainColor } from '@/generated'
import type { AuditImageResp } from '@/generated/arca_apiComponents'

import { USE_MOCK } from '../api/chat-api'

import { uploadImageToTosWithMeta, type TosImageUploadResult } from './tos-upload'

export type ChatBackgroundUploadResult = {
  imageUrl: string
  bkgMainColor?: string
}

export class ChatBackgroundAuditError extends Error {
  constructor(message?: string) {
    super(message ?? 'Image audit failed')
    this.name = 'ChatBackgroundAuditError'
  }
}

function isAuditPassed(audit: AuditImageResp | null | undefined): boolean {
  if (audit == null) return true
  return audit.passed !== false
}

async function fetchImageMainColor(upload: TosImageUploadResult): Promise<string | undefined> {
  try {
    const resp = await getImageMainColor({ image: upload.storageObject })
    return resp.bkg_main_color || undefined
  } catch {
    return undefined
  }
}

// web-to-rn: RN 中没有 File/Blob，使用 uri 字符串代替
// 方案：uploadImageToTosWithMeta 需要支持接收 uri 字符串（而非 File 对象）
export async function uploadChatBackgroundImage(
  fileUri: string,
): Promise<ChatBackgroundUploadResult> {
  if (USE_MOCK) {
    return { imageUrl: fileUri }
  }

  const upload = await uploadImageToTosWithMeta(fileUri)
  const audit = await auditImage({ audit_url: upload.url })

  if (!isAuditPassed(audit)) {
    throw new ChatBackgroundAuditError(audit?.msg)
  }

  const bkgMainColor = await fetchImageMainColor(upload)

  return {
    imageUrl: upload.url,
    bkgMainColor,
  }
}
