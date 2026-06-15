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
  sendComment: (content: string) => boolean
}

export function useSendComment(
  target: SendCommentTarget,
  onSent?: () => void,
): UseSendCommentResult {
  const sendComment = useCallback(
    (content: string): boolean => {
      const text = content.trim()
      if (!text || !target) return false

      if (target.kind === 'story') {
        void storyApi.replyToStory(target.storyId, text).catch(err => {
          console.error('[useSendComment] story comment failed:', err)
        })
        onSent?.()
        return true
      }

      if (target.kind === 'post') {
        void sendPostComment(target.characterId, text)
          .then(() => {
            onSent?.()
          })
          .catch(err => {
            console.error('[useSendComment] post comment failed:', err)
          })
        return true
      }

      sendCommentToChat(target.characterId, text)
      onSent?.()
      return true
    },
    [target, onSent],
  )

  return { sendComment }
}
