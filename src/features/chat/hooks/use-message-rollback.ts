import { useCallback, useState } from 'react'

import { memoryRollback } from '../api/chat-api'
import { resetFollowUpConsumed } from '../lib/follow-up-scheduler'
import {
  extractMessageCopyText,
  extractUserRollbackDraft,
  isRollbackableMessage,
  resolveServerMessageId,
  truncateMessagesFromRollback,
} from '../lib/message-rollback'
import type { ChatMessage } from '../model/types'
import { useChatSessionStore } from '../store/chat-session-store'

import type { ReplyPlaybackControls } from './use-reply-playback'

async function copyToClipboard(text: string) {
  try {
    const Clipboard = require('expo-clipboard')
    await Clipboard.setStringAsync(text)
  } catch { /* silent */ }
}

export function useMessageRollback(
  characterId: string,
  playback: ReplyPlaybackControls,
) {
  const [menuTarget, setMenuTarget] = useState<ChatMessage | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<ChatMessage | null>(null)
  const [isRollingBack, setIsRollingBack] = useState(false)

  const openMenu = useCallback((message: ChatMessage) => {
    if (!isRollbackableMessage(message)) return
    setMenuTarget(message)
  }, [])

  const closeMenu = useCallback(() => {
    setMenuTarget(null)
  }, [])

  const handleCopy = useCallback(
    async (message: ChatMessage) => {
      const text = extractMessageCopyText(message).trim()
      if (!text) return

      try {
        await copyToClipboard(text)
      } catch (error) {
        console.error('[chat] copy message failed:', error)
      } finally {
        closeMenu()
      }
    },
    [closeMenu],
  )

  const requestRollback = useCallback(
    (message: ChatMessage) => {
      closeMenu()
      setConfirmTarget(message)
    },
    [closeMenu],
  )

  const cancelConfirm = useCallback(() => {
    if (isRollingBack) return
    setConfirmTarget(null)
  }, [isRollingBack])

  const confirmRollback = useCallback(async () => {
    const target = confirmTarget
    if (!target || !characterId) return

    const msgId = resolveServerMessageId(target)
    if (!msgId) {
      setConfirmTarget(null)
      return
    }

    setIsRollingBack(true)
    try {
      await memoryRollback({ character_id: characterId, msg_id: msgId })

      playback.cancelPlayback()
      resetFollowUpConsumed(characterId)

      const draft = extractUserRollbackDraft(target)
      const { messages, setMessages, setRollbackDraft } = useChatSessionStore.getState()
      setMessages(truncateMessagesFromRollback(messages, target))
      setRollbackDraft(draft)
    } catch (error) {
      console.error('[chat] memory rollback failed:', error)
    } finally {
      setIsRollingBack(false)
      setConfirmTarget(null)
    }
  }, [characterId, confirmTarget, playback])

  const menuCopyText = menuTarget ? extractMessageCopyText(menuTarget).trim() : ''
  const canRollback = menuTarget ? Boolean(resolveServerMessageId(menuTarget)) : false

  return {
    menuTarget,
    confirmTarget,
    isRollingBack,
    menuCopyText,
    canRollback,
    openMenu,
    closeMenu,
    handleCopy,
    requestRollback,
    cancelConfirm,
    confirmRollback,
  }
}
