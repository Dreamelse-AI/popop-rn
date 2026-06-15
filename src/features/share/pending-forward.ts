import { sessionStore } from '@/shared/session-store'

const KEY_PREFIX = 'arca:pending-forward:'

function key(characterId: string): string {
  return `${KEY_PREFIX}${characterId}`
}

export function putPendingForward(characterId: string, text: string) {
  if (!characterId || !text) return
  try {
    sessionStore.set(key(characterId), text)
  } catch {
    // storage 不可用：忽略
  }
}

export function takePendingForward(characterId: string): string | null {
  try {
    const value = sessionStore.get(key(characterId))
    if (value) sessionStore.remove(key(characterId))
    return value
  } catch {
    return null
  }
}
