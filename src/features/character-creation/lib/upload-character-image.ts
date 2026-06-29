import { uploadImageToTosWithMeta, type TosImageUploadResult } from '@/features/chat/lib/tos-upload';

import { USE_CHARACTER_CREATION_MOCK } from '../config';

/**
 * 上传角色形象图片。
 * RN 中接收 fileUri（本地文件路径），而非 Web 的 File/Blob。
 */
export async function uploadCharacterAppearanceImage(fileUri: string): Promise<TosImageUploadResult> {
  if (USE_CHARACTER_CREATION_MOCK) {
    return {
      url: fileUri,
      bucket: 'mock-bucket',
      objectKey: `mock/${Date.now()}.jpg`,
      storageObject: { bucket_name: 'mock-bucket', object_key: `mock/${Date.now()}.jpg`, object_type: 'image', url: fileUri },
    };
  }

  return uploadImageToTosWithMeta(fileUri);
}
