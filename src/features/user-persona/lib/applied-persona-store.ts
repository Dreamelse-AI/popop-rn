import { storage } from '@/shared/storage'

const STORAGE_KEY = 'chat_applied_persona_v1'

type AppliedPersonaMap = Record<string, string>

function readMap(): AppliedPersonaMap {
  try {
    const raw = storage.get(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as unknown
    if (typeof data !== 'object' || data === null) return {}
    return Object.fromEntries(
      Object.entries(data).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string',
      ),
    )
  } catch {
    return {}
  }
}

function writeMap(map: AppliedPersonaMap): void {
  storage.set(STORAGE_KEY, JSON.stringify(map))
}

export function getAppliedPersonaId(characterId: string): string | null {
  if (!characterId) return null
  return readMap()[characterId] ?? null
}

export function setAppliedPersonaId(characterId: string, personaId: string): void {
  if (!characterId || !personaId) return
  writeMap({ ...readMap(), [characterId]: personaId })
}
