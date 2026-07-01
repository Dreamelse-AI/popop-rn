import { useCallback } from 'react'
import { AppState, Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { appleAuthAndroid } from '@invertase/react-native-apple-authentication'
import { authApi } from '../auth-api'
import type { AuthResponse } from '../auth-types'
import { env } from '@/shared/env'
import { generateNonce, sha256Hash } from '../utils/oauth-utils'

/**
 * Apple 登录原生面板会让 app 短暂进入非 active 状态，
 * 面板关闭后 AppState 不会立刻恢复 active。等待恢复后再请求后端，
 * 否则 api-client 的 isOnline() 误判为离线抛出 "Network unavailable"。
 */
function waitForAppActive(timeoutMs = 3000): Promise<void> {
  if (AppState.currentState === 'active') return Promise.resolve()
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      sub.remove()
      resolve()
    }, timeoutMs)
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        clearTimeout(timer)
        sub.remove()
        resolve()
      }
    })
  })
}

async function loginIOS(): Promise<AuthResponse> {
  const isAvailable = await AppleAuthentication.isAvailableAsync()
  if (!isAvailable) {
    throw new Error('Apple Sign In is not available on this device')
  }

  const nonce = generateNonce()

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce,
  })

  const idToken = credential.identityToken
  if (!idToken) {
    throw new Error('Apple login failed: no identity_token received')
  }

  await waitForAppActive()

  return authApi.createOAuthSession('apple', {
    idToken,
    nonce,
  })
}

async function loginAndroid(): Promise<AuthResponse> {
  if (!appleAuthAndroid.isSupported) {
    throw new Error(
      'Apple Sign In requires a native rebuild. Run: npx expo run:android',
    )
  }
  const { appleAndroidClientId, appleAndroidRedirectUri } = env
  if (!appleAndroidClientId || !appleAndroidRedirectUri) {
    throw new Error('Apple Sign In on Android is not configured yet')
  }

  const requestNonce = generateNonce()

  appleAuthAndroid.configure({
    clientId: appleAndroidClientId,
    redirectUri: appleAndroidRedirectUri,
    responseType: appleAuthAndroid.ResponseType.ID_TOKEN,
    scope: appleAuthAndroid.Scope.ALL,
    nonce: requestNonce,
  })

  const response = await appleAuthAndroid.signIn()

  const idToken = response.id_token
  if (!idToken) {
    throw new Error('Apple login failed: no identity_token received')
  }

  await waitForAppActive()

  // Android Web OAuth：invertase 把 rawNonce 做 SHA256 后发给 Apple，id_token.nonce 是哈希值。
  // 后端要求 nonce 与 id_token 内 nonce 一致，故发 SHA256(rawNonce)。
  const rawNonce = response.nonce ?? requestNonce
  const nonce = await sha256Hash(rawNonce)

  return authApi.createOAuthSession('apple', {
    idToken,
    nonce,
  })
}

export function useAppleLogin() {
  const login = useCallback((): Promise<AuthResponse> => {
    return Platform.OS === 'android' ? loginAndroid() : loginIOS()
  }, [])

  return { login }
}
