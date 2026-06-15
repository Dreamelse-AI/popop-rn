import { storage } from '@/shared/storage'

const STORAGE_KEY = 'chat_custom_backgrounds'

export type StoredCustomBackground = {
  id: string
  image: string
  bkgMainColor?: string
}

function parseStoredBackgrounds(raw: string | undefined): StoredCustomBackground[] {
  if (!raw) return []

  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []

    return data.filter((item): item is StoredCustomBackground => {
      if (typeof item !== 'object' || item === null) return false
      if (typeof item.id !== 'string' || typeof item.image !== 'string') return false
      if (
        'bkgMainColor' in item &&
        item.bkgMainColor !== undefined &&
        typeof item.bkgMainColor !== 'string'
      ) {
        return false
      }
      return true
    })
  } catch {
    return []
  }
}

export function loadCustomBackgrounds(): StoredCustomBackground[] {
  try {
    return parseStoredBackgrounds(storage.get(STORAGE_KEY))
  } catch {
    return []
  }
}

export function saveCustomBackgrounds(backgrounds: StoredCustomBackground[]): void {
  storage.set(STORAGE_KEY, JSON.stringify(backgrounds))
}

export function appendCustomBackground(background: StoredCustomBackground): StoredCustomBackground[] {
  const next = [...loadCustomBackgrounds(), background]
  saveCustomBackgrounds(next)
  return next
}

export function removeCustomBackground(id: string): StoredCustomBackground[] {
  const next = loadCustomBackgrounds().filter(item => item.id !== id)
  saveCustomBackgrounds(next)
  return next
}
