import { uploadAiGenImageToTos } from '@/features/chat/lib/tos-upload';

import { USE_CHARACTER_CREATION_MOCK } from '../config';

/**
 * 上传角色形象图片。
 * RN 中接收 fileUri（本地文件路径），而非 Web 的 File/Blob。
 */
export async function uploadCharacterAppearanceImage(fileUri: string): Promise<string> {
  if (USE_CHARACTER_CREATION_MOCK) {
    // Mock 模式下直接返回本地 URI
    return fileUri;
  }

  return uploadAiGenImageToTos(fileUri);
}
