import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'
import { storage } from '@/shared/storage'

import ko from './locales/ko.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'
import en from './locales/en.json'

const LANGUAGE_STORAGE_KEY = 'popop-language'
const SUPPORTED_LANGUAGES = ['ko', 'ja', 'zh', 'en'] as const
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
}

function detectDeviceLanguage(): string {
  const deviceLang = getLocales()[0]?.languageCode ?? ''
  const prefix = deviceLang.toLowerCase()
  if (isSupportedLanguage(prefix)) {
    return prefix
  }
  return 'en'
}

function getInitialLanguage(): string {
  const saved = storage.get(LANGUAGE_STORAGE_KEY)
  if (saved && isSupportedLanguage(saved)) {
    return saved
  }
  return detectDeviceLanguage()
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
  storage.set(LANGUAGE_STORAGE_KEY, lng)
})

export { LANGUAGE_STORAGE_KEY }
export default i18n
