import { create } from 'zustand'
import { storage, secureStorage } from '@/shared/storage'

type AuthState = {
  isLoggedIn: boolean
  token: string | null
  tokenExpiresAt: number | null
  isRestoringSession: boolean
  login: (token: string, expiresIn: number) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

const TOKEN_KEY = 'arca_token'
const TOKEN_EXPIRES_AT_KEY = 'arca_token_expires_at'

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  token: null,
  tokenExpiresAt: null,
  isRestoringSession: true,

  login: async (token, expiresIn) => {
    const tokenExpiresAt = Date.now() + expiresIn * 1000
    await secureStorage.set(TOKEN_KEY, token)
    storage.set(TOKEN_EXPIRES_AT_KEY, String(tokenExpiresAt))
    set({ isLoggedIn: true, token, tokenExpiresAt, isRestoringSession: false })
  },

  logout: async () => {
    await secureStorage.remove(TOKEN_KEY)
    storage.remove(TOKEN_EXPIRES_AT_KEY)
    set({ isLoggedIn: false, token: null, tokenExpiresAt: null })
  },

  restoreSession: async () => {
    const expiresAt = Number(storage.get(TOKEN_EXPIRES_AT_KEY) ?? 0)

    if (expiresAt <= Date.now()) {
      await secureStorage.remove(TOKEN_KEY)
      storage.remove(TOKEN_EXPIRES_AT_KEY)
      set({ isLoggedIn: false, token: null, tokenExpiresAt: null, isRestoringSession: false })
      return
    }

    const token = await secureStorage.get(TOKEN_KEY)
    if (token) {
      set({ isLoggedIn: true, token, tokenExpiresAt: expiresAt, isRestoringSession: false })
    } else {
      storage.remove(TOKEN_EXPIRES_AT_KEY)
      set({ isLoggedIn: false, token: null, tokenExpiresAt: null, isRestoringSession: false })
    }
  },
}))

if (__DEV__) {
  const { trackZustandStore } = require('@/shared/dev/zustand-reactotron') as typeof import('@/shared/dev/zustand-reactotron')
  trackZustandStore('AuthStore', useAuthStore)
}
