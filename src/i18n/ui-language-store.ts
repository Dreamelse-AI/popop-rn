import { storage } from '@/shared/storage'

const UI_LANGUAGE_STORAGE_KEY = 'popop-ui-language'

export const SUPPORTED_UI_LANGUAGES = ['ko', 'ja', 'zh', 'en'] as const
export type SupportedUiLanguage = (typeof SUPPORTED_UI_LANGUAGES)[number]

export function isSupportedUiLanguage(language: string): language is SupportedUiLanguage {
  const normalized = language.trim().toLowerCase().split('-')[0] ?? ''
  return (SUPPORTED_UI_LANGUAGES as readonly string[]).includes(normalized)
}

export function normalizeUiLanguage(language: string): SupportedUiLanguage {
  const normalized = language.trim().toLowerCase().split('-')[0] ?? ''
  return isSupportedUiLanguage(normalized) ? normalized : 'en'
}

export function readStoredUiLanguage(): SupportedUiLanguage | null {
  const saved = storage.get(UI_LANGUAGE_STORAGE_KEY)
  if (saved && isSupportedUiLanguage(saved)) {
    return normalizeUiLanguage(saved)
  }
  return null
}

export function persistUiLanguage(language: string): void {
  storage.set(UI_LANGUAGE_STORAGE_KEY, normalizeUiLanguage(language))
}
