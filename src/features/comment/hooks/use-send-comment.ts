import { useCallback } from 'react'

import { sendCommentToChat } from '@/features/chat/lib/send-comment-to-chat'
import { sendPostComment } from '@/features/comment/lib/send-post-comment'
import { storyApi } from '@/features/story/story-api'

export type SendCommentTarget =
  | { kind: 'story'; storyId: string }
  | { kind: 'post'; characterId: string }
  | { kind: 'chat'; characterId: string }
  | null

type UseSendCommentResult = {
  sendComment: (content: string) => Promise<boolean>
}

export function useSendComment(
  target: SendCommentTarget,
  onSent?: () => void,
): UseSendCommentResult {
  const sendComment = useCallback(
    async (content: string): Promise<boolean> => {
      const text = content.trim()
      if (!text || !target) return false

      try {
        if (target.kind === 'story') {
          await storyApi.replyToStory(target.storyId, text)
          onSent?.()
          return true
        }

        if (target.kind === 'post') {
          await sendPostComment(target.characterId, text)
          onSent?.()
          return true
        }

        await sendCommentToChat(target.characterId, text)
        onSent?.()
        return true
      } catch (err) {
        console.error('[useSendComment] comment failed:', err)
        return false
      }
    },
    [target, onSent],
  )

  return { sendComment }
}
