import { storage } from '@/shared/storage'

const STORAGE_KEY = 'friendship_character_version_dismiss'

type DismissMap = Record<string, number>

function loadMap(): DismissMap {
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

function saveMap(map: DismissMap) {
  if (Object.keys(map).length === 0) {
    storage.remove(STORAGE_KEY)
    return
  }
  storage.set(STORAGE_KEY, JSON.stringify(map))
}

export function getDismissedCharacterVersion(characterSaveId: string): number | null {
  const value = loadMap()[characterSaveId]
  return typeof value === 'number' ? value : null
}

export function markCharacterVersionDismissed(
  characterSaveId: string,
  latestVersionNo: number,
): void {
  const map = loadMap()
  map[characterSaveId] = latestVersionNo
  saveMap(map)
}

export function clearCharacterVersionDismissed(characterSaveId: string): void {
  const map = loadMap()
  if (!(characterSaveId in map)) return
  delete map[characterSaveId]
  saveMap(map)
}

export function shouldPromptCharacterVersionSync(options: {
  characterSaveId: string
  currentVersionNo: number
  latestVersionNo: number
  hasChatHistory: boolean
}): boolean {
  const { characterSaveId, currentVersionNo, latestVersionNo, hasChatHistory } = options
  if (!hasChatHistory) return false
  if (currentVersionNo >= latestVersionNo) return false
  return getDismissedCharacterVersion(characterSaveId) !== latestVersionNo
}
