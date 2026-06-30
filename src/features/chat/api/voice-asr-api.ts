import arcaWebapi from '@/shared/api/arca-webapi'
import type { StorageObject } from '@/generated/arca_apiComponents'

import { uploadAudioToTosWithMeta } from '../lib/tos-upload'

/** /file/asr_recognize 响应（IDL ASRResp） */
type ASRResp = {
  text?: string
}

/** 调用后端语音转文字接口（IDL mobileASR：POST /file/asr_recognize） */
function mobileASR(audioUrl: StorageObject): Promise<ASRResp> {
  return arcaWebapi.post<ASRResp>('/file/asr_recognize', { audio_url: audioUrl })
}

/**
 * 后端语音转文字：本地音频先上传 TOS，再调用 /file/asr_recognize 取识别文本。
 * 参考 popop-fe transcribeVoiceWithBackend 实现。
 */
export async function transcribeVoiceWithBackend(
  fileUri: string,
): Promise<{ text: string; storageObject: StorageObject }> {
  const upload = await uploadAudioToTosWithMeta(fileUri)
  const storageObject: StorageObject = {
    bucket_name: upload.bucket,
    object_key: upload.objectKey,
    object_type: 'audio',
    url: upload.url,
  }
  const resp = await mobileASR(storageObject)
  return { text: resp.text?.trim() ?? '', storageObject }
}
