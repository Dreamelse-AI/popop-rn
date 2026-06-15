const STORAGE_KEY = 'friendship_removed_friends';

type RemovedFriendMap = Record<string, { hadChatHistory: boolean }>;

function loadMap(): RemovedFriendMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as unknown;
    if (typeof data !== 'object' || data === null) return {};
    return Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) =>
          typeof key === 'string' &&
          typeof value === 'object' &&
          value !== null &&
          typeof (value as { hadChatHistory?: unknown }).hadChatHistory === 'boolean',
      ),
    ) as RemovedFriendMap;
  } catch {
    return {};
  }
}

function saveMap(map: RemovedFriendMap) {
  try {
    if (Object.keys(map).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage 不可用：忽略
  }
}

export function markLocallyRemovedFriend(characterId: string, hadChatHistory: boolean) {
  if (!characterId) return;
  const map = loadMap();
  map[characterId] = { hadChatHistory };
  saveMap(map);
}

export function wasLocallyRemovedFriend(characterId: string): boolean {
  return Boolean(loadMap()[characterId]);
}

export function hadLocalChatHistoryBeforeRemoval(characterId: string): boolean {
  return loadMap()[characterId]?.hadChatHistory ?? false;
}

export function clearLocallyRemovedFriend(characterId: string) {
  if (!characterId) return;
  const map = loadMap();
  if (!(characterId in map)) return;
  delete map[characterId];
  saveMap(map);
}
