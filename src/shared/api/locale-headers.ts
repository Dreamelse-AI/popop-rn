import type { AccountRegion } from '@/features/auth/auth-types'
import { getLanguageForRegion } from '@/features/auth/region-config'
import { getAccountRegion } from '@/shared/api/account-region-store'

export type ApiLanguage = 'en' | 'ja' | 'ko' | 'zh-Hans' | 'zh-Hant'
/** X-Region：ISO 3166-1 alpha-2 大写 */
export type ApiRegion = 'JP' | 'KR' | 'TW' | 'HK' | 'US' | 'GB' | 'CN'

const ACCOUNT_REGION_TO_API_REGION: Record<AccountRegion, ApiRegion> = {
  JP: 'JP',
  KR: 'KR',
  TW: 'TW',
  HK: 'HK',
  US: 'US',
  GB: 'GB',
  CN: 'CN',
  OTHER: 'US',
}

export function toApiRegion(accountRegion: AccountRegion): ApiRegion {
  return ACCOUNT_REGION_TO_API_REGION[accountRegion]
}

export function toApiLanguage(language: string): ApiLanguage {
  const normalized = language.trim().toLowerCase()

  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  if (normalized === 'ja' || normalized.startsWith('ja-')) return 'ja'
  if (normalized === 'ko' || normalized.startsWith('ko-')) return 'ko'
  if (normalized === 'zh-hant' || normalized.startsWith('zh-hant') || normalized === 'zh-tw' || normalized === 'zh-hk') {
    return 'zh-Hant'
  }
  if (
    normalized === 'zh-hans'
    || normalized.startsWith('zh-hans')
    || normalized === 'zh-cn'
    || normalized === 'zh'
  ) {
    return 'zh-Hans'
  }

  return 'en'
}

/** X-Language / X-Region 均由 AccountRegion 派生，保证二者一致 */
export function buildLocaleHeaders(
  accountRegion = getAccountRegion(),
): Record<'X-Language' | 'X-Region', ApiLanguage | ApiRegion> {
  const language = getLanguageForRegion(accountRegion)
  return {
    'X-Language': toApiLanguage(language),
    'X-Region': toApiRegion(accountRegion),
  }
}
