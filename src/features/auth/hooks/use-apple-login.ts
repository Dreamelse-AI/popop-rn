import { useCallback } from 'react'
import { AppState } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import { authApi } from '../auth-api'
import type { AuthResponse } from '../auth-types'

/** 生成原始随机 nonce（hex 字符串）。与 Google 登录一致：原样写入 id_token 的 nonce claim，
 *  并把同一个原始值发往后端比对（后端不做哈希，直接比对 nonce == token.nonce_claim）。 */
function generateNonce(length = 32): string {
  const bytes = Crypto.getRandomBytes(length)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

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

export function useAppleLogin() {
  const login = useCallback(async (): Promise<AuthResponse> => {
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
  }, [])

  return { login }
}
