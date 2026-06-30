import type { SetChatPreferenceReq } from '@/generated/arca_apiComponents'

import {
  appendCustomBackground,
  loadCustomBackgrounds,
} from './chat-background-store'
import {
  DEFAULT_CHAT_ATMOSPHERE,
  findBackground,
  normalizeBackgroundId,
  normalizeBubbleStyleId,
  PRESET_BACKGROUNDS,
  type ChatAtmosphereConfig,
} from './chat-atmosphere-presets'
import { resolveTosAssetUrl } from './tos-upload'

const PRESET_BACKGROUND_IDS = new Set(PRESET_BACKGROUNDS.map(item => item.id))

function imageRefMatches(a: string, b: string): boolean {
  if (a === b) return true
  return resolveTosAssetUrl(a) === resolveTosAssetUrl(b)
}

function ensureCustomBackgroundId(imageRef: string, bkgMainColor?: string): string {
  const existing = loadCustomBackgrounds().find(item => imageRefMatches(item.image, imageRef))
  if (existing) return existing.id

  const id = `custom-${Date.now()}`
  appendCustomBackground({ id, image: imageRef, bkgMainColor })
  return id
}

/** 将前端氛围配置编码为 chat_preference 的背景 / 气泡字段 */
export function encodeAtmospherePreferenceFields(
  config: ChatAtmosphereConfig,
): Pick<SetChatPreferenceReq, 'background_url' | 'clear_background' | 'bubble_key' | 'clear_bubble'> {
  const background = findBackground(config.backgroundId)
  const bubbleStyleId = normalizeBubbleStyleId(config.bubbleStyleId)

  const bubbleFields: Pick<SetChatPreferenceReq, 'bubble_key' | 'clear_bubble'> =
    bubbleStyleId === DEFAULT_CHAT_ATMOSPHERE.bubbleStyleId
      ? { clear_bubble: true }
      : { bubble_key: bubbleStyleId }

  if (!background) {
    return { clear_background: true, ...bubbleFields }
  }

  if (background.type === 'color') {
    return { background_url: background.id, ...bubbleFields }
  }

  const imageRef = typeof background.image === 'string' ? background.image : undefined
  if (!imageRef) {
    return { clear_background: true, ...bubbleFields }
  }

  return { background_url: imageRef, ...bubbleFields }
}

function resolveBackgroundIdFromPreference(backgroundUrl: string | undefined): string {
  const trimmed = backgroundUrl?.trim() ?? ''
  if (!trimmed) return DEFAULT_CHAT_ATMOSPHERE.backgroundId

  const normalizedPresetId = normalizeBackgroundId(trimmed)
  if (PRESET_BACKGROUND_IDS.has(normalizedPresetId)) {
    return normalizedPresetId
  }

  return ensureCustomBackgroundId(trimmed)
}

/** 将 chat_preference 当前值还原为前端氛围配置 */
export function decodeAtmospherePreference(
  backgroundUrl: string | undefined,
  bubbleKey: string | undefined,
): ChatAtmosphereConfig {
  const bubbleStyleId = normalizeBubbleStyleId(
    bubbleKey?.trim() || DEFAULT_CHAT_ATMOSPHERE.bubbleStyleId,
  )
  const backgroundId = resolveBackgroundIdFromPreference(backgroundUrl)

  return {
    backgroundId,
    bubbleStyleId,
    customThemeId: DEFAULT_CHAT_ATMOSPHERE.customThemeId,
  }
}
