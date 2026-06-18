import { useFriendshipStore } from '@/features/friendship/store/friendship-store';
import type { ChatWithCharacterReq } from '@/generated/arca_apiComponents';

import { useChatSessionStore } from '../store/chat-session-store';

/** 若角色已是好友，返回 friendship_id；否则 undefined（非好友聊天模式） */
export function resolveFriendshipId(characterId: string): string | undefined {
  const session = useChatSessionStore.getState();
  if (session.characterId === characterId && session.friendshipId) {
    return session.friendshipId;
  }

  const friend = useFriendshipStore
    .getState()
    .friends.find(item => item.character_id === characterId);

  return friend?.friendship_id || undefined;
}

/** 按 IDL：已是好友时附带 friendship_id，未带则走非好友聊天模式 */
export function enrichChatWithCharacterReq(req: ChatWithCharacterReq): ChatWithCharacterReq {
  if (req.friendship_id) return req;

  const friendshipId = resolveFriendshipId(req.character_id);
  return friendshipId ? { ...req, friendship_id: friendshipId } : req;
}
