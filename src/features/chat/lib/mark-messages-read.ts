import type { PhoneMessageOutput } from '@/generated/arca_apiComponents';

import { useFriendshipStore } from '@/features/friendship/store/friendship-store';

import { updateMessageReadStatus } from '../api/chat-api';

import { pickLatestPhoneMessage } from './phone-message-adapter';

export function pickLatestMessageIdForRead(
  outputs?: PhoneMessageOutput[],
): string | null {
  const latest = pickLatestPhoneMessage(outputs);
  return latest?.message_id ?? null;
}

/** 标记某角色消息已读，并同步清除好友列表 unread_count */
export async function markCharacterMessagesRead(
  characterId: string,
  msgId: string,
): Promise<void> {
  if (!characterId || !msgId) return;

  useFriendshipStore.getState().clearUnreadCount(characterId);

  try {
    await updateMessageReadStatus({
      character_id: characterId,
      msg_id: msgId,
      is_read: true,
    });
  } catch {
    // 乐观更新已生效；返回消息页时会 force refresh 与服务端对齐
  }
}

export function markCharacterMessagesReadFromOutputs(
  characterId: string,
  outputs?: PhoneMessageOutput[],
): void {
  const msgId = pickLatestMessageIdForRead(outputs);
  if (!msgId) return;
  void markCharacterMessagesRead(characterId, msgId);
}
