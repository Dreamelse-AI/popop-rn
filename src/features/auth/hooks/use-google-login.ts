import { useCallback } from 'react'
import { Platform } from 'react-native'
import * as Crypto from 'expo-crypto'
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

function generateNonce(length = 32): string {
  const bytes = Crypto.getRandomBytes(length)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function useGoogleLogin() {
  const login = useCallback(async (): Promise<AuthResponse> => {
    await GoogleSignin.hasPlayServices()

    // iOS (GoogleSignIn 9.0+) 支持注入自定义 nonce，会被写入 id_token 的 nonce claim，
    // 与发往后端的 nonce 一致以通过 OIDC 校验。Android 旧版 API 不支持自定义 nonce。
    const nonce = Platform.OS === 'ios' ? generateNonce() : ''
    const response = await GoogleSignin.signIn(nonce ? { nonce } : undefined)

    if (isCancelledResponse(response)) {
      throw new Error(LOGIN_CANCELLED)
    }

    const idToken = isSuccessResponse(response) ? response.data.idToken : undefined
    if (!idToken) {
      throw new Error('Google login failed: no id_token received')
    }

    return authApi.createOAuthSession('google', {
      idToken,
      nonce,
    })
  }, [])

  return { login }
}
