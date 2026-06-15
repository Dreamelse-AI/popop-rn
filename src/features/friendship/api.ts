import type { AddFriendResp, UpdateFriendSaveVersionResp } from '@/generated';
import {
  addFriend,
  listFriendship,
  pinCharacter,
  removeFriend,
  unpinCharacter,
  updateFriendSaveVersion,
} from '@/generated';

import { USE_MOCK as USE_CHAT_MOCK } from '@/features/chat/api/chat-api';

import * as mock from '@/features/friendship/lib/friendship-api.mock';
import { applyReFriendHandoff } from '@/features/friendship/lib/re-friend-handoff-bridge';

const USE_MOCK = USE_CHAT_MOCK;

export const friendshipApi = {
  listFriends: (limit = 50) => listFriendship({ limit }),

  addFriend: async (characterId: string): Promise<AddFriendResp> => {
    const resp = USE_MOCK
      ? await mock.addFriend({ character_id: characterId })
      : await addFriend({ character_id: characterId });
    applyReFriendHandoff(characterId, resp);
    return resp;
  },

  pinCharacter: (characterId: string) => pinCharacter({ character_id: characterId }),

  unpinCharacter: (characterId: string) => unpinCharacter({ character_id: characterId }),

  removeFriend: async (characterId: string) => {
    if (USE_MOCK) {
      return mock.removeFriend({ character_id: characterId });
    }
    return removeFriend({ character_id: characterId });
  },

  removeFriends: async (characterIds: string[]) => {
    if (USE_MOCK) {
      await Promise.all(characterIds.map(id => mock.removeFriend({ character_id: id })));
      return;
    }
    await Promise.all(characterIds.map(id => removeFriend({ character_id: id })));
  },

  updateSaveVersion: async (
    characterSaveId: string,
    characterVersionNo: number,
  ): Promise<UpdateFriendSaveVersionResp> => {
    if (USE_MOCK) {
      return mock.updateSaveVersion({
        character_save_id: characterSaveId,
        character_version_no: characterVersionNo,
      });
    }
    return updateFriendSaveVersion({
      character_save_id: characterSaveId,
      character_version_no: characterVersionNo,
    });
  },
};
