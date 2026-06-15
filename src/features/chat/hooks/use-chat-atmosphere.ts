import { useCallback, useEffect, useState } from 'react'

import { saveChatAtmosphereSettings } from '../api/chat-atmosphere-api'
import {
  DEFAULT_CHAT_ATMOSPHERE,
  getBubbleStyleTokens,
  resolvePageBackground,
  type BubbleStyleTokens,
  type ChatAtmosphereConfig,
  type ResolvedPageBackground,
} from '../lib/chat-atmosphere-presets'
import { loadChatAtmosphere } from '../lib/chat-atmosphere-store'

export function useChatAtmosphere(characterId: string) {
  const [config, setConfig] = useState<ChatAtmosphereConfig>(() =>
    characterId ? loadChatAtmosphere(characterId) : DEFAULT_CHAT_ATMOSPHERE,
  )

  useEffect(() => {
    if (!characterId) return
    setConfig(loadChatAtmosphere(characterId))
  }, [characterId])

  const pageBackground: ResolvedPageBackground = resolvePageBackground(config)
  const bubbleStyle: BubbleStyleTokens = getBubbleStyleTokens(config.bubbleStyleId)

  const applyConfig = useCallback(
    async (nextConfig: ChatAtmosphereConfig) => {
      if (!characterId) {
        setConfig(nextConfig)
        return
      }
      const saved = await saveChatAtmosphereSettings(characterId, nextConfig)
      setConfig(nextConfig)
      return saved
    },
    [characterId],
  )

  return { config, pageBackground, bubbleStyle, applyConfig }
}
