import { useCallback, useEffect, useState } from 'react'

import type { ListEmojiPanelResp } from '@/generated/arca_apiComponents'

import { listEmojiPanel } from '../api/chat-api'
import { buildEmojiDescriptionMap } from '../lib/character-adapter'
import { writeEmojiPanelSession } from '../lib/emoji-panel-session'
import { flattenEmojiPanel } from '../lib/emoji-panel-utils'
import { useChatSessionStore } from '../store/chat-session-store'

function mergeEmojiDescriptions(
  current: Map<string, string>,
  panel: ListEmojiPanelResp,
): Map<string, string> {
  const merged = new Map(current)
  for (const [id, label] of buildEmojiDescriptionMap(flattenEmojiPanel(panel))) {
    merged.set(id, label)
  }
  return merged
}

export function useEmojiPanel(open: boolean) {
  const emojiPanel = useChatSessionStore(s => s.emojiPanel)
  const isLoadingHistory = useChatSessionStore(s => s.isLoadingHistory)
  const setEmojiPanel = useChatSessionStore(s => s.setEmojiPanel)
  const setEmojiList = useChatSessionStore(s => s.setEmojiList)
  const setEmojiDescriptions = useChatSessionStore(s => s.setEmojiDescriptions)

  const [fetching, setFetching] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)

  const loadEmojiPanel = useCallback(async () => {
    setFetching(true)
    setFetchFailed(false)
    try {
      const resp = await listEmojiPanel()
      writeEmojiPanelSession(resp)
      setEmojiPanel(resp)
      setEmojiList(flattenEmojiPanel(resp))
      setEmojiDescriptions(
        mergeEmojiDescriptions(useChatSessionStore.getState().emojiDescriptions, resp),
      )
    } catch {
      setFetchFailed(true)
    } finally {
      setFetching(false)
    }
  }, [setEmojiDescriptions, setEmojiList, setEmojiPanel])

  useEffect(() => {
    if (!open || emojiPanel || isLoadingHistory || fetching) return
    void loadEmojiPanel()
  }, [emojiPanel, fetching, isLoadingHistory, loadEmojiPanel, open])

  const loading = (isLoadingHistory && !emojiPanel) || fetching

  return { emojiPanel, loading, fetchFailed, retry: loadEmojiPanel }
}
