import { sessionStore } from '@/shared/session-store'
import type { PhoneMessageOutput } from '@/generated/arca_apiComponents'

export type ReFriendHandoff = {
  characterMessages: PhoneMessageOutput[]
}

const HANDOFF_KEY_PREFIX = 'arca:re-friend-handoff:'
const PENDING_KEY_PREFIX = 'arca:re-friend-pending:'

function handoffKey(characterId: string): string {
  return `${HANDOFF_KEY_PREFIX}${characterId}`
}

function pendingKey(characterId: string): string {
  return `${PENDING_KEY_PREFIX}${characterId}`
}

export function putReFriendHandoff(
  characterId: string,
  characterMessages: PhoneMessageOutput[],
) {
  if (!characterId || characterMessages.length === 0) return
  try {
    sessionStore.set(handoffKey(characterId), JSON.stringify({ characterMessages }))
  } catch {
    // storage 不可用：忽略
  }
}

export function hasReFriendHandoff(characterId: string): boolean {
  try {
    return Boolean(sessionStore.get(handoffKey(characterId)))
  } catch {
    return false
  }
}

export function takeReFriendHandoff(characterId: string): ReFriendHandoff | null {
  try {
    const raw = sessionStore.get(handoffKey(characterId))
    if (!raw) return null
    sessionStore.remove(handoffKey(characterId))
    clearReFriendPending(characterId)
    const parsed = JSON.parse(raw) as ReFriendHandoff
    if (!Array.isArray(parsed?.characterMessages) || parsed.characterMessages.length === 0) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function markReFriendPending(characterId: string) {
  if (!characterId) return
  try {
    sessionStore.set(pendingKey(characterId), '1')
  } catch {
    // storage 不可用：忽略
  }
}

export function hasReFriendPending(characterId: string): boolean {
  try {
    return sessionStore.get(pendingKey(characterId)) === '1'
  } catch {
    return false
  }
}

export function takeReFriendPending(characterId: string): boolean {
  if (!hasReFriendPending(characterId)) return false
  clearReFriendPending(characterId)
  return true
}

export function clearReFriendPending(characterId: string) {
  try {
    sessionStore.remove(pendingKey(characterId))
  } catch {
    // storage 不可用：忽略
  }
}
