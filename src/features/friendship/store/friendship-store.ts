import { create } from 'zustand';

import type { FriendshipBasicInfo } from '@/generated';

import { apiClient } from '@/shared/api/api-client';
import { friendshipApi } from '../api';
import {
  applyLocalPinnedAt,
  clearLocalPinnedAt,
  setLocalPinnedAt,
} from '../lib/local-pinned-at';
import { markLocallyRemovedFriend } from '../lib/removed-friend-tracker';

function sortFriends(friends: FriendshipBasicInfo[]): FriendshipBasicInfo[] {
  return [...friends].sort((a, b) => {
    const pinnedDiff = (b.pinned_at ?? 0) - (a.pinned_at ?? 0);
    if (pinnedDiff !== 0) return pinnedDiff;
    return (b.last_active_at ?? 0) - (a.last_active_at ?? 0);
  });
}

function patchPinnedAt(
  friends: FriendshipBasicInfo[],
  characterId: string,
  pinnedAt: number,
): FriendshipBasicInfo[] {
  return sortFriends(
    friends.map(item =>
      item.character_id === characterId ? { ...item, pinned_at: pinnedAt } : item,
    ),
  );
}

type FriendshipStore = {
  friends: FriendshipBasicInfo[];
  loading: boolean;
  error: boolean;
  requestId: number;
  fetchList: (options?: { force?: boolean }) => Promise<void>;
  pinFriend: (characterId: string) => Promise<void>;
  unpinFriend: (characterId: string) => Promise<void>;
  removeFriends: (characterIds: string[]) => Promise<void>;
  clearUnreadCount: (characterId: string) => void;
  patchCharacterVersion: (characterId: string, versionNo: number) => void;
};

export const useFriendshipStore = create<FriendshipStore>((set, get) => ({
  friends: [],
  loading: false,
  error: false,
  requestId: 0,

  fetchList: async (options) => {
    if (!apiClient.getToken()) return;
    const { loading, requestId } = get();
    if (loading && !options?.force) return;

    const nextRequestId = requestId + 1;
    set({ requestId: nextRequestId, loading: true, error: false });

    try {
      const resp = await friendshipApi.listFriends();
      if (nextRequestId !== get().requestId) return;
      set({
        friends: sortFriends(applyLocalPinnedAt(resp.friends)),
        loading: false,
      });
    } catch (e) {
      if (nextRequestId !== get().requestId) return;
      console.error('[friendshipStore] fetch failed:', e);
      set({ error: true, loading: false });
    }
  },

  pinFriend: async (characterId: string) => {
    const pinnedAt = Date.now();
    setLocalPinnedAt(characterId, pinnedAt);
    set({ friends: patchPinnedAt(get().friends, characterId, pinnedAt) });
  },

  unpinFriend: async (characterId: string) => {
    setLocalPinnedAt(characterId, 0);
    set({ friends: patchPinnedAt(get().friends, characterId, 0) });
  },

  removeFriends: async (characterIds: string[]) => {
    if (characterIds.length === 0) return;

    const snapshot = get().friends;
    const removing = get().friends.filter(item => characterIds.includes(item.character_id));

    set({
      friends: get().friends.filter(item => !characterIds.includes(item.character_id)),
    });

    for (const friend of removing) {
      const hadChatHistory =
        (friend.latest_messages?.length ?? 0) > 0 || (friend.unread_count ?? 0) > 0;
      markLocallyRemovedFriend(friend.character_id, hadChatHistory);
      clearLocalPinnedAt(friend.character_id);
    }

    try {
      await friendshipApi.removeFriends(characterIds);
    } catch (e) {
      set({ friends: snapshot });
      console.error('[friendshipStore] remove failed:', e);
      throw e;
    }
  },

  clearUnreadCount: (characterId: string) =>
    set({
      friends: get().friends.map(friend =>
        friend.character_id === characterId ? { ...friend, unread_count: 0 } : friend,
      ),
    }),

  patchCharacterVersion: (characterId: string, versionNo: number) =>
    set({
      friends: get().friends.map(friend =>
        friend.character_id === characterId
          ? {
              ...friend,
              current_character_version_no: versionNo,
              latest_character_version_no: Math.max(
                friend.latest_character_version_no ?? versionNo,
                versionNo,
              ),
            }
          : friend,
      ),
    }),
}));
