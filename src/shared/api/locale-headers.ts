import type { AccountRegion } from '@/features/auth/auth-types'
import { getLanguageForRegion } from '@/features/auth/region-config'
import { getAccountRegion } from '@/shared/api/account-region-store'
import { readStoredUiLanguage } from '@/i18n/ui-language-store'

export type ApiLanguage = 'en' | 'ja' | 'ko' | 'zh-Hans' | 'zh-Hant'
/** X-Region：ISO 3166-1 alpha-2 大写，透传原始值；OTHER 为兼容别名，映射到 US */
export type ApiRegion = string

export function toApiRegion(accountRegion: AccountRegion): ApiRegion {
  // OTHER 是内部兼容别名，API 侧不认识，透传为 US
  if (accountRegion === 'OTHER') return 'US'
  return accountRegion.toUpperCase()
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

/**
 * X-Language 优先使用用户手动选择的 UI 语言，否则由 AccountRegion 派生。
 * X-Region 始终由 AccountRegion 派生。
 */
export function buildLocaleHeaders(
  accountRegion = getAccountRegion(),
): Record<'X-Language' | 'X-Region', ApiLanguage | ApiRegion> {
  const storedUiLanguage = readStoredUiLanguage()
  const language = storedUiLanguage ?? getLanguageForRegion(accountRegion)
  return {
    'X-Language': toApiLanguage(language),
    'X-Region': toApiRegion(accountRegion),
  }
}
