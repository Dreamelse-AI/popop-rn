import { loadCustomBackgrounds, type StoredCustomBackground } from './chat-background-store'
import { resolveTosAssetUrl } from './tos-upload'

export type BubbleStyleId = 'classic' | 'dark' | 'blue'

export type ChatAtmosphereConfig = {
  backgroundId: string
  bubbleStyleId: BubbleStyleId
  customThemeId: string
}

export type PresetBackground = {
  id: string
  type: 'color'
  color: string
}

export type ImageBackground = {
  id: string
  type: 'image'
  image: string
  bkgMainColor?: string
}

export type CustomBackground = {
  id: string
  type: 'custom'
  image: string
  bkgMainColor?: string
}

export type BackgroundItem = PresetBackground | ImageBackground | CustomBackground

export type CustomTheme = {
  id: string
  image: string
}

export type BubbleTailVariant = 'white' | 'yellow' | 'black' | 'blue'

export type BubbleStyleTokens = {
  received: {
    bgColor: string
    tail: BubbleTailVariant
    textColor: string
  }
  sent: {
    bgColor: string
    tail: BubbleTailVariant
    textColor: string
  }
}

export const DEFAULT_CHAT_ATMOSPHERE: ChatAtmosphereConfig = {
  backgroundId: 'yellow',
  bubbleStyleId: 'classic',
  customThemeId: 'theme-1',
}

export const PRESET_BACKGROUNDS: BackgroundItem[] = [
  { id: 'yellow', type: 'color', color: '#fbf2d8' },
]

export const CUSTOM_THEMES: CustomTheme[] = []

export const BUBBLE_STYLE_TOKENS: Record<BubbleStyleId, BubbleStyleTokens> = {
  classic: {
    received: { bgColor: '#ffffff', tail: 'white', textColor: '#000000' },
    sent: { bgColor: '#fdeab3', tail: 'yellow', textColor: 'rgba(0,0,0,0.9)' },
  },
  dark: {
    received: { bgColor: '#ffffff', tail: 'white', textColor: '#000000' },
    sent: { bgColor: '#1a1a1a', tail: 'black', textColor: '#ffffff' },
  },
  blue: {
    received: { bgColor: '#ffffff', tail: 'white', textColor: '#000000' },
    sent: { bgColor: '#3b82f6', tail: 'blue', textColor: '#ffffff' },
  },
}

export function getAllBackgrounds(): BackgroundItem[] {
  const customs: BackgroundItem[] = loadCustomBackgrounds().map(
    (bg: StoredCustomBackground) => ({
      id: bg.id,
      type: 'custom' as const,
      image: bg.image,
      bkgMainColor: bg.bkgMainColor,
    }),
  )
  return [...PRESET_BACKGROUNDS, ...customs]
}

export function getBubbleStyleTokens(bubbleStyleId: BubbleStyleId): BubbleStyleTokens {
  return BUBBLE_STYLE_TOKENS[bubbleStyleId]
}

export function getBackgroundPreview(backgroundId: string): {
  previewImage?: string
  color?: string
} {
  const all = getAllBackgrounds()
  const item = all.find(bg => bg.id === backgroundId)
  if (!item) return { color: '#fbf2d8' }
  if (item.type === 'color') return { color: item.color }
  return { previewImage: item.image }
}

export type ResolvedPageBackground = {
  baseColor: string
  imageUrl?: string
}

export function findBackground(id: string): BackgroundItem | undefined {
  return getAllBackgrounds().find(item => item.id === id)
}

export function resolvePageBackground(config: ChatAtmosphereConfig): ResolvedPageBackground {
  const background = findBackground(config.backgroundId)

  if (background?.type === 'color') {
    return { baseColor: background.color }
  }

  if (background?.type === 'image' || background?.type === 'custom') {
    return {
      baseColor: background.bkgMainColor ?? '#fbf2d8',
      imageUrl: resolveTosAssetUrl(background.image),
    }
  }

  return { baseColor: '#fbf2d8' }
}
