import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { readStoredUiLanguage, persistUiLanguage } from './ui-language-store'

import ko from './locales/ko.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'
import en from './locales/en.json'

const SUPPORTED_LANGUAGES = ['ko', 'ja', 'zh', 'en'] as const
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const LANGUAGE_OPTIONS: ReadonlyArray<{ code: SupportedLanguage; label: string }> = [
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: 'Chinese' },
]

function getInitialLanguage(): SupportedLanguage {
  return readStoredUiLanguage() ?? 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    ja: { translation: ja },
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  persistUiLanguage(lng)
})

export { LANGUAGE_OPTIONS, SUPPORTED_LANGUAGES }
export default i18n
