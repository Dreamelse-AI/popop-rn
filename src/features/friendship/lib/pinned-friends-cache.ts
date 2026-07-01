import { storage } from '@/shared/storage';

import type { FriendshipBasicInfo } from '@/generated';

const STORAGE_KEY = 'friendship_pinned_cache';

/**
 * 置顶角色本地缓存：/friendship/list_pinned 的最近一次成功结果。
 * 用于「本地缓存 + 乐观更新」策略——冷启动时先渲染缓存，网络返回后再覆盖。
 */
export function loadPinnedCache(): FriendshipBasicInfo[] {
  try {
    const raw = storage.get(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is FriendshipBasicInfo =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { character_id?: unknown }).character_id === 'string',
    );
  } catch {
    return [];
  }
}

export function savePinnedCache(friends: FriendshipBasicInfo[]) {
  try {
    if (friends.length === 0) {
      storage.remove(STORAGE_KEY);
      return;
    }
    storage.set(STORAGE_KEY, JSON.stringify(friends));
  } catch {
    // storage 不可用：忽略
  }
}

export function clearPinnedCache() {
  try {
    storage.remove(STORAGE_KEY);
  } catch {
    // storage 不可用：忽略
  }
}
