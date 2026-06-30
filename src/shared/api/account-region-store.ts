import type { AccountRegion } from '@/features/auth/auth-types'
import {
  DEFAULT_ACCOUNT_REGION,
  getDeviceAccountRegion,
  getLanguageForRegion,
  getMockAccountRegion,
  mapCountryCodeToAccountRegion,
} from '@/features/auth/region-config'
import { API_BASE, IP_REGION_PATH } from '@/shared/api/api-base'
import { buildRequestSignHeaders } from '@/shared/api/request-sign'
import i18n from '@/i18n'
import { storage } from '@/shared/storage'
import { readStoredUiLanguage } from '@/i18n/ui-language-store'

const ACCOUNT_REGION_STORAGE_KEY = 'popop-account-region'

let regionReady = false
let bootstrapPromise: Promise<AccountRegion> | null = null
let resolvedRegion: AccountRegion | null = null

function clearLegacyAccountRegionStorage(): void {
  storage.remove(ACCOUNT_REGION_STORAGE_KEY)
}

function syncLanguageToRegion(region: AccountRegion): void {
  // 用户已手动选择过语言，不覆盖
  if (readStoredUiLanguage()) return

  const language = getLanguageForRegion(region)
  if (i18n.language !== language) {
    void i18n.changeLanguage(language)
  }
}

export function isAccountRegionReady(): boolean {
  return regionReady
}

export function getAccountRegion(): AccountRegion {
  return resolvedRegion ?? DEFAULT_ACCOUNT_REGION
}

/** 当前会话内更新 region，并同步绑定 language（不写入存储） */
export function setAccountRegion(region: AccountRegion): void {
  resolvedRegion = region
  syncLanguageToRegion(region)
}

async function fetchIPRegionIso(): Promise<string | null | 'empty'> {
  const method = 'GET'
  const bodyString = ''

  const accountRegion = getAccountRegion()
  const storedUiLanguage = readStoredUiLanguage()
  const language = storedUiLanguage ?? getLanguageForRegion(accountRegion)

  const xRegion = accountRegion === 'OTHER' ? 'US' : accountRegion.toUpperCase()
  const normalized = language.trim().toLowerCase()
  let xLanguage = 'en'
  if (normalized === 'ja' || normalized.startsWith('ja-')) xLanguage = 'ja'
  else if (normalized === 'ko' || normalized.startsWith('ko-')) xLanguage = 'ko'
  else if (normalized === 'zh-hant' || normalized.startsWith('zh-hant') || normalized === 'zh-tw' || normalized === 'zh-hk') xLanguage = 'zh-Hant'
  else if (normalized === 'zh-hans' || normalized.startsWith('zh-hans') || normalized === 'zh-cn' || normalized === 'zh') xLanguage = 'zh-Hans'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Language': xLanguage,
    'X-Region': xRegion,
    ...(await buildRequestSignHeaders(method, IP_REGION_PATH, bodyString)),
  }

  try {
    const res = await fetch(`${API_BASE}${IP_REGION_PATH}`, { method, headers })
    const json = await res.json().catch(() => null) as {
      code?: number
      data?: { region?: string } | null
    } | null

    if (!res.ok || !json || json.code !== 0 || !json.data) {
      return null
    }

    const iso = json.data.region?.trim()
    return iso ? iso : 'empty'
  } catch {
    return null
  }
}

function resolveRegionFromBootstrap(ipResult: string | null | 'empty'): AccountRegion {
  const mock = getMockAccountRegion()
  if (mock) return mock

  if (typeof ipResult === 'string' && ipResult !== 'empty') {
    return mapCountryCodeToAccountRegion(ipResult)
  }
  return getDeviceAccountRegion()
}

/**
 * 应用启动：请求 /app/ip_region，并同步 i18n 语言。
 * 1. MOCK_DEVICE_REGION 有值（默认 US）→ 直接使用
 * 2. 接口有 region → 原始 ISO 码透传（已知国家映射，未知直接透传）
 * 3. 接口无 region / 失败 → 设备地区 → US（en）
 */
export function bootstrapAccountRegion(): Promise<AccountRegion> {
  if (regionReady) {
    return Promise.resolve(getAccountRegion())
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      clearLegacyAccountRegionStorage()

      const ipResult = await fetchIPRegionIso()
      const region = resolveRegionFromBootstrap(ipResult)

      resolvedRegion = region
      syncLanguageToRegion(region)
      regionReady = true
      return region
    })().finally(() => {
      bootstrapPromise = null
    })
  }

  return bootstrapPromise
}

export function waitForAccountRegion(): Promise<AccountRegion> {
  return bootstrapAccountRegion()
}
