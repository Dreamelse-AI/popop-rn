import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { sessionStore } from '@/shared/session-store'
import { generateNonce } from '../utils/oauth-utils'
import { authApi } from '../auth-api'
import type { AuthResponse } from '../auth-types'

export type CodeProvider = 'line' | 'kakao'

const PROVIDERS: Record<CodeProvider, { authorizeUrl: string; clientId: string; scope: string }> = {
  line: {
    authorizeUrl: 'https://access.line.me/oauth2/v2.1/authorize',
    clientId: '2010212340',
    scope: 'openid profile',
  },
  kakao: {
    authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
    clientId: '1a87d0426e971191e71ef707e2d3edfb',
    scope: 'openid',
  },
}

const stateKey = (p: string) => `oauth_state_${p}`
const nonceKey = (p: string) => `oauth_nonce_${p}`
const redirectKey = (p: string) => `oauth_redirect_${p}`

export function isCodeProvider(p: string | undefined): p is CodeProvider {
  return p === 'line' || p === 'kakao'
}

export async function startOAuthCodeLogin(provider: CodeProvider): Promise<AuthResponse> {
  const cfg = PROVIDERS[provider]
  const state = generateNonce()
  const nonce = generateNonce()
  const redirectUri = makeRedirectUri({ scheme: 'popop' })

  sessionStore.set(stateKey(provider), state)
  sessionStore.set(nonceKey(provider), nonce)
  sessionStore.set(redirectKey(provider), redirectUri)

  const authUrl = new URL(cfg.authorizeUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', cfg.clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', cfg.scope)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('nonce', nonce)

  const result = await WebBrowser.openAuthSessionAsync(authUrl.toString(), redirectUri)

  if (result.type !== 'success') {
    throw new Error(`${provider} login cancelled`)
  }

  const url = new URL(result.url)
  const code = url.searchParams.get('code')
  if (!code) {
    throw new Error(`${provider} login failed: no code received`)
  }

  return authApi.createOAuthSession(provider, {
    code,
    nonce,
    redirectUri,
  })
}

export function consumeOAuthCodeSession(provider: string) {
  const state = sessionStore.get(stateKey(provider))
  const nonce = sessionStore.get(nonceKey(provider))
  const redirectUri = sessionStore.get(redirectKey(provider))
  sessionStore.remove(stateKey(provider))
  sessionStore.remove(nonceKey(provider))
  sessionStore.remove(redirectKey(provider))
  return { state, nonce, redirectUri }
}
