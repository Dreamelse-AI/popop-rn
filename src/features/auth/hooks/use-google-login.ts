import { useCallback } from 'react'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { authApi } from '../auth-api'
import type { AuthResponse } from '../auth-types'

const GOOGLE_IOS_CLIENT_ID = '875163971501-eg6ltniot9voha7laehf4q9nv1c64b06.apps.googleusercontent.com'

GoogleSignin.configure({
  iosClientId: GOOGLE_IOS_CLIENT_ID,
})

export function useGoogleLogin() {
  const login = useCallback(async (): Promise<AuthResponse> => {
    await GoogleSignin.hasPlayServices()
    const response = await GoogleSignin.signIn()

    const idToken = response.data?.idToken
    if (!idToken) {
      throw new Error('Google login failed: no id_token received')
    }

    return authApi.createOAuthSession('google', {
      idToken,
      nonce: '',
    })
  }, [])

  return { login }
}
