import { env } from '@/shared/env'

/** 本地 dev token 在 storage 中使用的「永不过期」时间戳 */
export const DEV_AUTH_TOKEN_NEVER_EXPIRES_AT = Number.MAX_SAFE_INTEGER

export function getDevAuthToken(): string | null {
  if (!__DEV__) return null

  const token = env.devAuthToken.trim()
  return token.length > 0 ? token : null
}

export function isDevAuthTokenActive(): boolean {
  return getDevAuthToken() !== null
}
