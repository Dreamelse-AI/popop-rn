import type { AddFriendResp } from '@/generated';

import {
  hasReFriendHandoff,
  markReFriendPending,
} from '@/features/chat/lib/re-friend-handoff';

import {
  clearLocallyRemovedFriend,
  hadLocalChatHistoryBeforeRemoval,
  wasLocallyRemovedFriend,
} from './removed-friend-tracker';

function isReFriendAdd(resp: AddFriendResp, characterId: string): boolean {
  if (!resp.is_new) return true;
  return wasLocallyRemovedFriend(characterId) && hadLocalChatHistoryBeforeRemoval(characterId);
}

/** 加好友成功后：标记需在聊天页触发重新加好友打招呼（Mock 预生成消息时跳过） */
export function applyReFriendHandoff(characterId: string, resp: AddFriendResp) {
  if (!characterId) return;

  if (!hasReFriendHandoff(characterId) && isReFriendAdd(resp, characterId)) {
    markReFriendPending(characterId);
  }

  clearLocallyRemovedFriend(characterId);
}
