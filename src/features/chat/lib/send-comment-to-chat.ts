import { CHARS_PER_SECOND } from '../config/chat-config'
import { chatWithCharacter } from '../api/chat-api'
import { isChatScreenMounted } from './chat-screen-presence'
import { markCharacterMessagesReadFromOutputs } from './mark-messages-read'
import { createOptimisticTextMessage, buildPlaybackUnits } from './phone-message-adapter'
import { deliverCharacterRepliesImmediately } from './reply-delivery'
import { isActiveChatSession } from './session-guard'
import { useChatSessionStore } from '../store/chat-session-store'
import type { PhoneMessageOutput } from '@/generated/arca_apiComponents'

function canSeedStore(characterId: string): boolean {
  const { characterId: current } = useChatSessionStore.getState()
  return current === null || current === characterId
}

function playRepliesSequentially(characterId: string, outputs: PhoneMessageOutput[]) {
  const { emojiDescriptions } = useChatSessionStore.getState()
  const units = buildPlaybackUnits(outputs, { emojiDescriptions })
  useChatSessionStore.getState().setOutboundPhase('playingReply')
  useChatSessionStore.getState().setTyping(true)

  let index = 0
  const step = () => {
    if (!isActiveChatSession(characterId)) return
    const unit = units[index]
    if (!unit) {
      const store = useChatSessionStore.getState()
      store.setTyping(false)
      store.setOutboundPhase('idle')
      markCharacterMessagesReadFromOutputs(characterId, outputs)
      return
    }
    index += 1
    useChatSessionStore.getState().appendMessage(unit.message)
    const delayMs = Math.ceil((unit.charCount / CHARS_PER_SECOND) * 1000)
    setTimeout(step, delayMs)
  }
  step()
}

export function sendCommentToChat(characterId: string, text: string) {
  const trimmed = text.trim()
  if (!characterId || !trimmed) return

  const seed = canSeedStore(characterId)
  let optimisticId: string | null = null

  if (seed) {
    const store = useChatSessionStore.getState()
    if (store.characterId !== characterId) {
      store.initSession(characterId)
      store.setLoadingHistory(false)
    }
    const optimistic = createOptimisticTextMessage(trimmed)
    optimisticId = optimistic.id
    useChatSessionStore.getState().appendMessage(optimistic)
    useChatSessionStore.getState().setTyping(true)
  }

  const settleOptimistic = (
    currentMessages?: PhoneMessageOutput[],
    hasCharacterReply = true,
  ) => {
    if (!optimisticId || !isActiveChatSession(characterId)) return
    const store = useChatSessionStore.getState()
    if (currentMessages && currentMessages.length > 0) {
      store.applyApiCurrentMessages(currentMessages, [optimisticId], {
        ignoreServerFailed: !hasCharacterReply,
      })
    }
    store.clearPendingByLocalIds([optimisticId])
  }

  void chatWithCharacter({
    character_id: characterId,
    chat_scene: 1,
    messages: [{ msg_type: 'text', text: { text: trimmed } }],
  })
    .then(resp => {
      const hasCharacterReply = resp.character_messages.length > 0
      settleOptimistic(resp.current_messages, hasCharacterReply)

      if (!hasCharacterReply) {
        if (isActiveChatSession(characterId)) {
          const store = useChatSessionStore.getState()
          store.setTyping(false)
          store.setOutboundPhase('idle')
        }
        return
      }
      if (isChatScreenMounted(characterId) && isActiveChatSession(characterId)) {
        playRepliesSequentially(characterId, resp.character_messages)
      } else {
        deliverCharacterRepliesImmediately(characterId, resp.character_messages)
      }
    })
    .catch(e => {
      console.error('[sendCommentToChat] failed:', e)
      if (isActiveChatSession(characterId)) {
        const store = useChatSessionStore.getState()
        store.setTyping(false)
        store.setOutboundPhase('idle')
      }
    })
}
