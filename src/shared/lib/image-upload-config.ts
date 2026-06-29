/** 图片上传场景 */
export type ImageUploadScene =
  | 'chat'
  | 'chatBackground'
  | 'randomMatchChat'
  | 'postDynamic'
  | 'characterAppearance'
  | 'personaAvatar'

/** 各场景允许一次选择的图片数量上限 */
export const IMAGE_UPLOAD_LIMITS: Record<ImageUploadScene, number> = {
  chat: 1,
  chatBackground: 1,
  randomMatchChat: 1,
  postDynamic: 9,
  characterAppearance: 9,
  personaAvatar: 1,
}

export function getImageUploadLimit(scene: ImageUploadScene): number {
  return IMAGE_UPLOAD_LIMITS[scene]
}
