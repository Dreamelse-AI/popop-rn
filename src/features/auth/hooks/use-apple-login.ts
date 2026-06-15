import { useCallback } from 'react'
import * as AppleAuthentication from 'expo-apple-authentication'
import { authApi } from '../auth-api'
import type { AuthResponse } from '../auth-types'

export function useAppleLogin() {
  const login = useCallback(async (): Promise<AuthResponse> => {
    const isAvailable = await AppleAuthentication.isAvailableAsync()
    if (!isAvailable) {
      throw new Error('Apple Sign In is not available on this device')
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })

    const idToken = credential.identityToken
    if (!idToken) {
      throw new Error('Apple login failed: no identity_token received')
    }

    return authApi.createOAuthSession('apple', {
      idToken,
      nonce: '',
    })
  }, [])

  return { login }
}
