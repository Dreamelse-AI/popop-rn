import { useCallback } from 'react'
import { Platform } from 'react-native'
import { GoogleSignin, isSuccessResponse, isCancelledResponse } from '@react-native-google-signin/google-signin'
import { authApi } from '../auth-api'
import type { AuthResponse } from '../auth-types'
import * as Crypto from 'expo-crypto'

export const LOGIN_CANCELLED = 'LOGIN_CANCELLED'

const GOOGLE_IOS_CLIENT_ID = '959580844343-p91v3bhk57jk06ililkavt498s8f2pkq.apps.googleusercontent.com'
const GOOGLE_ANDROID_CLIENT_ID = '959580844343-9lsu6dbnf5fraqoo7vh9badtsshjjpes.apps.googleusercontent.com'

function makeNonce(): string {
  const bytes = Crypto.getRandomBytes(16)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function useGoogleLogin() {
  const login = useCallback(async (): Promise<AuthResponse> => {
    await GoogleSignin.hasPlayServices()

    GoogleSignin.configure(
      Platform.select({
        ios: { iosClientId: GOOGLE_IOS_CLIENT_ID },
        android: { webClientId: GOOGLE_ANDROID_CLIENT_ID },
      })!,
    )

    const nonce = makeNonce()

    const response = await GoogleSignin.signIn(
      Platform.OS === 'ios' ? { nonce } : {},
    )

    if (isCancelledResponse(response)) {
      throw new Error(LOGIN_CANCELLED)
    }

    const idToken = isSuccessResponse(response) ? response.data.idToken : undefined
    if (!idToken) {
      throw new Error('Google login failed: no id_token received')
    }

    return authApi.createOAuthSession('google', {
      idToken,
      nonce: Platform.OS === 'ios' ? nonce : '',
    })
  }, [])

  return { login }
}
