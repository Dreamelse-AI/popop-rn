import * as ImagePicker from 'expo-image-picker'

import { getImageUploadLimit, type ImageUploadScene } from '@/shared/lib/image-upload-config'

import {
  ChatBackgroundAuditError,
  uploadChatBackgroundImage,
  type ChatBackgroundUploadResult,
} from './chat-background-upload'

export { ChatBackgroundAuditError }

export async function pickDeviceImageUris(maxCount: number): Promise<string[]> {
  if (maxCount <= 0) return []

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return []

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: maxCount > 1,
    selectionLimit: maxCount,
    quality: 0.8,
  })

  if (result.canceled) return []
  return result.assets.slice(0, maxCount).map(asset => asset.uri)
}

type PickAndUploadImagesOptions = {
  scene: ImageUploadScene
  maxCount?: number
}

/** 打开系统选图器，选中后直接上传，不经过「最近选用」缓存 */
export async function pickAndUploadImages({
  scene,
  maxCount,
}: PickAndUploadImagesOptions): Promise<ChatBackgroundUploadResult[]> {
  const limit = maxCount ?? getImageUploadLimit(scene)
  if (limit <= 0) return []

  const uris = await pickDeviceImageUris(limit)
  if (uris.length === 0) return []

  const results: ChatBackgroundUploadResult[] = []
  for (const uri of uris) {
    results.push(await uploadChatBackgroundImage(uri))
  }
  return results
}

export function getImageUploadErrorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  if (error instanceof ChatBackgroundAuditError) {
    return error.message || t('imageUpload.auditFailed')
  }
  return t('imageUpload.uploadFailed')
}
