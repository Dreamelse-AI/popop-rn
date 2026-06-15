import { storage } from '@/shared/storage'
import type { FriendshipBasicInfo } from '@/generated'

const STORAGE_KEY = 'friendship_local_pinned_at'

type LocalPinnedAtMap = Record<string, number>

function loadMap(): LocalPinnedAtMap {
  try {
    const raw = storage.get(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as unknown
    if (typeof data !== 'object' || data === null) return {}
    return Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) => typeof key === 'string' && typeof value === 'number',
      ),
    )
  } catch {
    return {}
  }
}

function saveMap(map: LocalPinnedAtMap) {
  if (Object.keys(map).length === 0) {
    storage.remove(STORAGE_KEY)
    return
  }
  storage.set(STORAGE_KEY, JSON.stringify(map))
}

export function setLocalPinnedAt(characterId: string, pinnedAt: number) {
  const map = loadMap()
  if (pinnedAt > 0) {
    map[characterId] = pinnedAt
  } else {
    map[characterId] = 0
  }
  saveMap(map)
}

export function clearLocalPinnedAt(characterId: string) {
  const map = loadMap()
  delete map[characterId]
  saveMap(map)
}

export function applyLocalPinnedAt(friends: FriendshipBasicInfo[]): FriendshipBasicInfo[] {
  const localMap = loadMap()
  if (Object.keys(localMap).length === 0) return friends

  return friends.map(friend => {
    const localPinned = localMap[friend.character_id]
    if (localPinned === undefined) return friend
    return { ...friend, pinned_at: localPinned }
  })
}
