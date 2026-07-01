import { create } from 'zustand';

import type { FriendshipBasicInfo } from '@/generated';

import { apiClient } from '@/shared/api/api-client';
import { registerSessionClearListener } from '@/shared/session/clear-user-session';
import { friendshipApi } from '../api';
import {
  clearPinnedCache,
  loadPinnedCache,
  savePinnedCache,
} from '../lib/pinned-friends-cache';
import { markLocallyRemovedFriend } from '../lib/removed-friend-tracker';

function sortFriends(friends: FriendshipBasicInfo[]): FriendshipBasicInfo[] {
  return [...friends].sort((a, b) => {
    const pinnedDiff = (b.pinned_at ?? 0) - (a.pinned_at ?? 0);
    if (pinnedDiff !== 0) return pinnedDiff;
    return (b.last_active_at ?? 0) - (a.last_active_at ?? 0);
  });
}

/** 写入内存并同步持久化置顶缓存。 */
function commitPinned(
  set: (partial: Partial<FriendshipStore>) => void,
  pinnedFriends: FriendshipBasicInfo[],
) {
  set({ pinnedFriends });
  savePinnedCache(pinnedFriends);
}

type FriendshipStore = {
  friends: FriendshipBasicInfo[];
  /** 置顶角色全量列表，来自 POST /friendship/list_pinned，无分页。 */
  pinnedFriends: FriendshipBasicInfo[];
  loading: boolean;
  error: boolean;
  requestId: number;
  fetchList: (options?: { force?: boolean }) => Promise<void>;
  pinFriend: (characterId: string) => Promise<void>;
  unpinFriend: (characterId: string) => Promise<void>;
  removeFriends: (characterIds: string[]) => Promise<void>;
  clearUnreadCount: (characterId: string) => void;
  patchCharacterVersion: (characterId: string, versionNo: number) => void;
  reset: () => void;
};

export const useFriendshipStore = create<FriendshipStore>((set, get) => ({
  friends: [],
  // 冷启动即水合本地缓存，网络返回后覆盖（本地缓存 + 乐观更新）
  pinnedFriends: loadPinnedCache(),
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
      const [listResp, pinnedResp] = await Promise.all([
        friendshipApi.listFriends(),
        friendshipApi.listPinnedFriends(),
      ]);
      if (nextRequestId !== get().requestId) return;
      set({
        friends: sortFriends(listResp.friends),
        loading: false,
      });
      commitPinned(set, pinnedResp.friends);
    } catch (e) {
      if (nextRequestId !== get().requestId) return;
      console.error('[friendshipStore] fetch failed:', e);
      set({ error: true, loading: false });
    }
  },

  pinFriend: async (characterId: string) => {
    const snapshot = get().pinnedFriends;
    const alreadyPinned = snapshot.some(item => item.character_id === characterId);
    const target = get().friends.find(item => item.character_id === characterId);

    if (!alreadyPinned && target) {
      commitPinned(set, [{ ...target, pinned_at: Date.now() }, ...snapshot]);
    }

    try {
      await friendshipApi.pinCharacter(characterId);
    } catch (e) {
      commitPinned(set, snapshot);
      console.error('[friendshipStore] pin failed:', e);
      throw e;
    }
  },

  unpinFriend: async (characterId: string) => {
    const snapshot = get().pinnedFriends;
    commitPinned(set, snapshot.filter(item => item.character_id !== characterId));

    try {
      await friendshipApi.unpinCharacter(characterId);
    } catch (e) {
      commitPinned(set, snapshot);
      console.error('[friendshipStore] unpin failed:', e);
      throw e;
    }
  },

  removeFriends: async (characterIds: string[]) => {
    if (characterIds.length === 0) return;

    const snapshot = get().friends;
    const pinnedSnapshot = get().pinnedFriends;
    const removing = get().friends.filter(item => characterIds.includes(item.character_id));

    set({
      friends: get().friends.filter(item => !characterIds.includes(item.character_id)),
    });
    commitPinned(
      set,
      pinnedSnapshot.filter(item => !characterIds.includes(item.character_id)),
    );

    for (const friend of removing) {
      const hadChatHistory =
        (friend.latest_messages?.length ?? 0) > 0 || (friend.unread_count ?? 0) > 0;
      markLocallyRemovedFriend(friend.character_id, hadChatHistory);
    }

    try {
      await friendshipApi.removeFriends(characterIds);
    } catch (e) {
      set({ friends: snapshot });
      commitPinned(set, pinnedSnapshot);
      console.error('[friendshipStore] remove failed:', e);
      throw e;
    }
  },

  clearUnreadCount: (characterId: string) => {
    const patch = (friend: FriendshipBasicInfo): FriendshipBasicInfo =>
      friend.character_id === characterId ? { ...friend, unread_count: 0 } : friend;
    set({ friends: get().friends.map(patch) });
    commitPinned(set, get().pinnedFriends.map(patch));
  },

  patchCharacterVersion: (characterId: string, versionNo: number) => {
    const patch = (friend: FriendshipBasicInfo): FriendshipBasicInfo =>
      friend.character_id === characterId
        ? {
            ...friend,
            current_character_version_no: versionNo,
            latest_character_version_no: Math.max(
              friend.latest_character_version_no ?? versionNo,
              versionNo,
            ),
          }
        : friend;

    set({ friends: get().friends.map(patch) });
    commitPinned(set, get().pinnedFriends.map(patch));
  },

  reset: () => {
    clearPinnedCache();
    set({
      friends: [],
      pinnedFriends: [],
      loading: false,
      error: false,
      requestId: get().requestId + 1,
    });
  },
}));

registerSessionClearListener(() => {
  useFriendshipStore.getState().reset();
});
