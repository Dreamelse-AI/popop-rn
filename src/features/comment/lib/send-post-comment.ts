import { sendCommentToChat } from '@/features/chat/lib/send-comment-to-chat'
import { ensureCharacterFriend } from '@/features/friendship/lib/ensure-character-friend'

export async function sendPostComment(characterId: string, text: string): Promise<void> {
  const trimmed = text.trim()
  if (!characterId || !trimmed) return

  await ensureCharacterFriend(characterId)
  sendCommentToChat(characterId, trimmed)
}
