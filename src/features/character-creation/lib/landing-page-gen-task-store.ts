import { storage } from '@/shared/storage'

const STORAGE_PREFIX = 'popop:landing-page-gen-task:v1:'

export type LandingPageGenTaskRecord = {
  taskId: string
  startedAt: number
}

function storageKey(storageId: string) {
  return `${STORAGE_PREFIX}${storageId}`
}

export function saveLandingPageGenTask(storageId: string, record: LandingPageGenTaskRecord): void {
  try {
    storage.set(storageKey(storageId), JSON.stringify(record))
  } catch (e) {
    console.warn('[landing-page-gen-task-store] save failed:', e)
  }
}

export function loadLandingPageGenTask(storageId: string): LandingPageGenTaskRecord | null {
  const raw = storage.get(storageKey(storageId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as LandingPageGenTaskRecord
    if (!parsed?.taskId?.trim()) return null
    return parsed
  } catch {
    return null
  }
}

export function clearLandingPageGenTask(storageId: string): void {
  storage.remove(storageKey(storageId))
}
