import { useCallback } from 'react'
import { Platform } from 'react-native'
import { GoogleSignin, isSuccessResponse, isCancelledResponse } from '@react-native-google-signin/google-signin'
import { authApi } from '../auth-api'
import type { AuthResponse } from '../auth-types'

export const LOGIN_CANCELLED = 'LOGIN_CANCELLED'

const GOOGLE_IOS_CLIENT_ID = '875163971501-17vv2c5589c9d4j7h2ml3icf48nqtk5b.apps.googleusercontent.com'
const GOOGLE_ANDROID_CLIENT_ID = '875163971501-93st2gobt1ip1j3c4p8g8ipbkk2og2s9.apps.googleusercontent.com'

GoogleSignin.configure(
  Platform.select({
    ios: { iosClientId: GOOGLE_IOS_CLIENT_ID },
    android: { webClientId: GOOGLE_ANDROID_CLIENT_ID },
  })!,
)

export function useGoogleLogin() {
  const login = useCallback(async (): Promise<AuthResponse> => {
    await GoogleSignin.hasPlayServices()

    const response = await GoogleSignin.signIn()

    if (isCancelledResponse(response)) {
      throw new Error(LOGIN_CANCELLED)
    }

    const idToken = isSuccessResponse(response) ? response.data.idToken : undefined
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
