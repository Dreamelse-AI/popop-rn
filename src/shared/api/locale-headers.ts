import type { AccountRegion } from '@/features/auth/auth-types'
import { getAccountRegion } from '@/shared/api/account-region-store'
import i18n from '@/i18n'

export type ApiLanguage = 'en' | 'ja' | 'ko' | 'zh-Hans' | 'zh-Hant'
export type ApiRegion = 'JP' | 'KR' | 'CN'

const ACCOUNT_REGION_TO_API_REGION: Record<AccountRegion, ApiRegion> = {
  JP: 'JP',
  KR: 'KR',
  TW: 'CN',
  OTHER: 'JP',
}

export function toApiRegion(accountRegion: AccountRegion): ApiRegion {
  return ACCOUNT_REGION_TO_API_REGION[accountRegion]
}

export function toApiLanguage(language: string): ApiLanguage {
  const normalized = language.trim().toLowerCase()

  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  if (normalized === 'ja' || normalized.startsWith('ja-')) return 'ja'
  if (normalized === 'ko' || normalized.startsWith('ko-')) return 'ko'
  if (normalized === 'zh-hant' || normalized.startsWith('zh-hant') || normalized === 'zh-tw') {
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

export function buildLocaleHeaders(
  language = i18n.language,
  accountRegion = getAccountRegion(),
): Record<'X-Language' | 'X-Region', ApiLanguage | ApiRegion> {
  return {
    'X-Language': toApiLanguage(language),
    'X-Region': toApiRegion(accountRegion),
  }
}
