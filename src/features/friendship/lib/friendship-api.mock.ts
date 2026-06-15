import type {
  AddFriendReq,
  AddFriendResp,
  RemoveFriendReq,
  RemoveFriendResp,
  UpdateFriendSaveVersionReq,
  UpdateFriendSaveVersionResp,
} from '@/generated';

import {
  getMockChatHistory,
  insertReFriendMessages,
  markMockFriendRemoved,
  markMockFriendRestored,
  wasMockFriendRemoved,
} from '@/features/chat/api/chat-friendship.mock';
import { putReFriendHandoff } from '@/features/chat/lib/re-friend-handoff';

function nextMockId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function addFriend(req: AddFriendReq): Promise<AddFriendResp> {
  const characterId = req.character_id;
  const hadRemoved = wasMockFriendRemoved(characterId);
  const hadHistory = getMockChatHistory(characterId).length > 0;
  const isReFriend = hadRemoved && hadHistory;

  markMockFriendRestored(characterId);

  if (isReFriend) {
    const { characterMessages } = insertReFriendMessages(characterId);
    putReFriendHandoff(characterId, characterMessages);
  }

  return {
    friendship_id: nextMockId('friendship'),
    character_save_id: nextMockId('save'),
    character_version_no: 1,
    is_new: !isReFriend,
  };
}

export async function removeFriend(req: RemoveFriendReq): Promise<RemoveFriendResp> {
  markMockFriendRemoved(req.character_id);
  return { removed: true, removed_save_count: 1 };
}

export async function updateSaveVersion(
  req: UpdateFriendSaveVersionReq,
): Promise<UpdateFriendSaveVersionResp> {
  return {
    character_save_id: req.character_save_id,
    character_version_no: req.character_version_no,
    updated: true,
  };
}
