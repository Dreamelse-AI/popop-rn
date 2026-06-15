import { storage } from '@/shared/storage'
import { NEW_USER_REGISTRATION_WINDOW_MS } from './feed-layout-config'

const REGISTRATION_AT_KEY = 'arca_user_registered_at'

export function markUserRegisteredAt(timestamp = Date.now()) {
  if (storage.get(REGISTRATION_AT_KEY)) return
  storage.set(REGISTRATION_AT_KEY, String(timestamp))
}

export function isNewFeedUser(now = Date.now()): boolean {
  const raw = storage.get(REGISTRATION_AT_KEY)
  if (!raw) return false
  const registeredAt = Number(raw)
  if (!Number.isFinite(registeredAt)) return false
  return now - registeredAt < NEW_USER_REGISTRATION_WINDOW_MS
}

export function clearUserRegisteredAt() {
  storage.remove(REGISTRATION_AT_KEY)
}
