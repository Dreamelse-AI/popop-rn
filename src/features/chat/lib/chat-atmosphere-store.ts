import {
  DEFAULT_CHAT_ATMOSPHERE,
  type BubbleStyleId,
  type ChatAtmosphereConfig,
} from './chat-atmosphere-presets'
import { storage } from '@/shared/storage'

const STORAGE_KEY = 'chat_atmosphere_by_character'

type StoredAtmosphereMap = Record<string, Partial<ChatAtmosphereConfig>>

function isBubbleStyleId(value: unknown): value is BubbleStyleId {
  return value === 'classic' || value === 'dark' || value === 'blue'
}

function parseStoredMap(raw: string | undefined): StoredAtmosphereMap {
  if (!raw) return {}

  try {
    const data = JSON.parse(raw) as unknown
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {}
    return data as StoredAtmosphereMap
  } catch {
    return {}
  }
}

function normalizeConfig(partial: Partial<ChatAtmosphereConfig> | undefined): ChatAtmosphereConfig {
  return {
    backgroundId:
      typeof partial?.backgroundId === 'string'
        ? partial.backgroundId
        : DEFAULT_CHAT_ATMOSPHERE.backgroundId,
    bubbleStyleId: isBubbleStyleId(partial?.bubbleStyleId)
      ? partial.bubbleStyleId
      : DEFAULT_CHAT_ATMOSPHERE.bubbleStyleId,
    customThemeId: DEFAULT_CHAT_ATMOSPHERE.customThemeId,
  }
}

export function loadChatAtmosphere(characterId: string): ChatAtmosphereConfig {
  if (!characterId) return DEFAULT_CHAT_ATMOSPHERE

  try {
    const map = parseStoredMap(storage.get(STORAGE_KEY))
    return normalizeConfig(map[characterId])
  } catch {
    return DEFAULT_CHAT_ATMOSPHERE
  }
}

export function saveChatAtmosphereLocal(
  characterId: string,
  config: ChatAtmosphereConfig,
): ChatAtmosphereConfig {
  if (!characterId) return config

  try {
    const map = parseStoredMap(storage.get(STORAGE_KEY))
    map[characterId] = normalizeConfig(config)
    storage.set(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // storage full or unavailable
  }

  return config
}
