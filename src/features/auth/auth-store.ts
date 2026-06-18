import { create } from 'zustand'
import { DEV_AUTH_TOKEN_NEVER_EXPIRES_AT, getDevAuthToken } from '@/features/auth/dev-auth-token'
import { storage, secureStorage } from '@/shared/storage'
import { sessionStore } from '@/shared/session-store'
import { clearUserSessionStores } from '@/shared/session/clear-user-session'

type AuthState = {
  isLoggedIn: boolean
  guestMode: boolean
  token: string | null
  tokenExpiresAt: number | null
  isRestoringSession: boolean
  login: (token: string, expiresIn: number) => Promise<void>
  enterGuestMode: () => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

const TOKEN_KEY = 'arca_token'
const TOKEN_EXPIRES_AT_KEY = 'arca_token_expires_at'
const GUEST_MODE_KEY = 'arca_guest_mode'

function readGuestMode(): boolean {
  return sessionStore.get(GUEST_MODE_KEY) === '1'
}

function setGuestModeStorage(enabled: boolean) {
  if (enabled) {
    sessionStore.set(GUEST_MODE_KEY, '1')
    return
  }
  sessionStore.remove(GUEST_MODE_KEY)
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  guestMode: false,
  token: null,
  tokenExpiresAt: null,
  isRestoringSession: true,

  login: async (token, expiresIn) => {
    const tokenExpiresAt = Date.now() + expiresIn * 1000
    setGuestModeStorage(false)
    await secureStorage.set(TOKEN_KEY, token)
    storage.set(TOKEN_EXPIRES_AT_KEY, String(tokenExpiresAt))
    set({ isLoggedIn: true, guestMode: false, token, tokenExpiresAt, isRestoringSession: false })
  },

  enterGuestMode: async () => {
    await secureStorage.remove(TOKEN_KEY)
    storage.remove(TOKEN_EXPIRES_AT_KEY)
    setGuestModeStorage(true)
    clearUserSessionStores()
    set({ isLoggedIn: false, guestMode: true, token: null, tokenExpiresAt: null, isRestoringSession: false })
  },

  logout: async () => {
    setGuestModeStorage(false)
    await secureStorage.remove(TOKEN_KEY)
    storage.remove(TOKEN_EXPIRES_AT_KEY)
    clearUserSessionStores()
    set({ isLoggedIn: false, guestMode: false, token: null, tokenExpiresAt: null })
  },

  restoreSession: async () => {
    const devToken = getDevAuthToken()
    if (devToken) {
      setGuestModeStorage(false)
      await secureStorage.set(TOKEN_KEY, devToken)
      storage.set(TOKEN_EXPIRES_AT_KEY, String(DEV_AUTH_TOKEN_NEVER_EXPIRES_AT))
      set({
        isLoggedIn: true,
        guestMode: false,
        token: devToken,
        tokenExpiresAt: DEV_AUTH_TOKEN_NEVER_EXPIRES_AT,
        isRestoringSession: false,
      })
      return
    }

    const expiresAt = Number(storage.get(TOKEN_EXPIRES_AT_KEY) ?? 0)

    if (expiresAt <= Date.now()) {
      await secureStorage.remove(TOKEN_KEY)
      storage.remove(TOKEN_EXPIRES_AT_KEY)
      set({
        isLoggedIn: false,
        guestMode: readGuestMode(),
        token: null,
        tokenExpiresAt: null,
        isRestoringSession: false,
      })
      return
    }

    const token = await secureStorage.get(TOKEN_KEY)
    if (token) {
      setGuestModeStorage(false)
      set({ isLoggedIn: true, guestMode: false, token, tokenExpiresAt: expiresAt, isRestoringSession: false })
    } else {
      storage.remove(TOKEN_EXPIRES_AT_KEY)
      set({
        isLoggedIn: false,
        guestMode: readGuestMode(),
        token: null,
        tokenExpiresAt: null,
        isRestoringSession: false,
      })
    }
  },
}))

export function hasAuthToken(): boolean {
  return Boolean(useAuthStore.getState().token)
}

if (__DEV__) {
  const { trackZustandStore } = require('@/shared/dev/zustand-reactotron') as typeof import('@/shared/dev/zustand-reactotron')
  trackZustandStore('AuthStore', useAuthStore)
}
