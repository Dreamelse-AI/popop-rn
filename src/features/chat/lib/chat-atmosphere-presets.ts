import { dialogPageStyleSettingsAssets } from '@/shared/assets/dialog/dialog-page-style-settings'

import type { ImageProps } from 'expo-image'

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

export type ImageAssetSource = string | number | { uri: string }

export type ImageBackground = {
  id: string
  type: 'image'
  image: ImageAssetSource
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
  image: ImageAssetSource
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
  {
    id: 'default-1',
    type: 'image',
    image: dialogPageStyleSettingsAssets.default1,
    bkgMainColor: '#fbf2d8',
  },
  {
    id: 'default-2',
    type: 'image',
    image: dialogPageStyleSettingsAssets.default2,
    bkgMainColor: '#fbf2d8',
  },
]

export const CUSTOM_THEMES: CustomTheme[] = [
  { id: 'theme-1', image: dialogPageStyleSettingsAssets.tempImg1 },
  { id: 'theme-2', image: dialogPageStyleSettingsAssets.tempImg2 },
  { id: 'theme-3', image: dialogPageStyleSettingsAssets.tempImg3 },
  { id: 'theme-4', image: dialogPageStyleSettingsAssets.tempImg4 },
  { id: 'theme-5', image: dialogPageStyleSettingsAssets.tempImg5 },
  { id: 'theme-6', image: dialogPageStyleSettingsAssets.tempImg6 },
]

export const BUBBLE_STYLE_TOKENS: Record<BubbleStyleId, BubbleStyleTokens> = {
  classic: {
    received: { bgColor: '#ffffff', tail: 'white', textColor: '#000000' },
    sent: { bgColor: '#fdeab3', tail: 'yellow', textColor: 'rgba(0,0,0,0.9)' },
  },
  dark: {
    received: { bgColor: '#ffffff', tail: 'white', textColor: '#000000' },
    sent: { bgColor: '#000000', tail: 'black', textColor: '#ffffff' },
  },
  blue: {
    received: { bgColor: '#d7f0ff', tail: 'blue', textColor: '#000000' },
    sent: { bgColor: '#fdeab3', tail: 'yellow', textColor: 'rgba(0,0,0,0.9)' },
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

export function resolveImageAssetSource(image: ImageAssetSource): ImageProps['source'] {
  if (typeof image === 'number') {
    return image
  }
  if (typeof image === 'string') {
    return { uri: resolveTosAssetUrl(image) }
  }
  return { uri: resolveTosAssetUrl(image.uri) }
}

export function getBackgroundPreview(backgroundId: string): {
  previewSource?: ImageProps['source']
  color?: string
} {
  const background = findBackground(backgroundId)

  if (!background || background.type === 'color') {
    return { color: background?.type === 'color' ? background.color : '#fbf2d8' }
  }

  return {
    color: background.bkgMainColor ?? '#fbf2d8',
    previewSource: resolveImageAssetSource(background.image),
  }
}

export type ResolvedPageBackground = {
  baseColor: string
  imageSource?: ImageProps['source']
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
      imageSource: resolveImageAssetSource(background.image),
    }
  }

  return { baseColor: '#fbf2d8' }
}
