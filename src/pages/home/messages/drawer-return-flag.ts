import { sessionStore } from '@/shared/session-store'

const KEY = 'arca:reopen-character-drawer'

export function markReopenCharacterDrawer() {
  sessionStore.set(KEY, '1')
}

export function takeReopenCharacterDrawer(): boolean {
  const value = sessionStore.get(KEY)
  if (value) sessionStore.remove(KEY)
  return value === '1'
}

const RETURN_TO_CHARACTER_TAB_KEY = 'arca:return-to-character-tab'

export function markReturnToCharacterTab() {
  sessionStore.set(RETURN_TO_CHARACTER_TAB_KEY, '1')
}

export function takeReturnToCharacterTab(): boolean {
  const value = sessionStore.get(RETURN_TO_CHARACTER_TAB_KEY)
  if (value) sessionStore.remove(RETURN_TO_CHARACTER_TAB_KEY)
  return value === '1'
}
