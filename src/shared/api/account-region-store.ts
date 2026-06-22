import type { AccountRegion } from '@/features/auth/auth-types'
import {
  ACCOUNT_REGION_STORAGE_KEY,
  DEFAULT_ACCOUNT_REGION,
  getDeviceAccountRegion,
  getLanguageForRegion,
  isAccountRegion,
  mapCountryCodeToAccountRegion,
} from '@/features/auth/region-config'
import { API_BASE, IP_REGION_PATH } from '@/shared/api/api-base'
import { buildLocaleHeaders } from '@/shared/api/locale-headers'
import { buildRequestSignHeaders } from '@/shared/api/request-sign'
import i18n from '@/i18n'
import { storage } from '@/shared/storage'

export { ACCOUNT_REGION_STORAGE_KEY }

let regionReady = false
let bootstrapPromise: Promise<AccountRegion> | null = null
let resolvedRegion: AccountRegion | null = null

function readStoredAccountRegion(): AccountRegion | null {
  const saved = storage.get(ACCOUNT_REGION_STORAGE_KEY)
  if (saved && isAccountRegion(saved)) {
    return saved
  }
  return null
}

function persistAccountRegion(region: AccountRegion): void {
  storage.set(ACCOUNT_REGION_STORAGE_KEY, region)
}

function syncLanguageToRegion(region: AccountRegion): void {
  const language = getLanguageForRegion(region)
  if (i18n.language !== language) {
    void i18n.changeLanguage(language)
  }
}

export function isAccountRegionReady(): boolean {
  return regionReady
}

export function getAccountRegion(): AccountRegion {
  return resolvedRegion ?? readStoredAccountRegion() ?? DEFAULT_ACCOUNT_REGION
}

export function setAccountRegion(region: AccountRegion): void {
  resolvedRegion = region
  persistAccountRegion(region)
  syncLanguageToRegion(region)
}

async function fetchIPRegionIso(): Promise<string | null | 'empty'> {
  const method = 'GET'
  const bodyString = ''
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...buildLocaleHeaders(),
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

function resolveRegionFromBootstrap(
  ipResult: string | null | 'empty',
  cached: AccountRegion | null,
): AccountRegion {
  if (typeof ipResult === 'string' && ipResult !== 'empty') {
    return mapCountryCodeToAccountRegion(ipResult)
  }
  if (ipResult === 'empty') {
    return getDeviceAccountRegion()
  }
  return cached ?? getDeviceAccountRegion()
}

/**
 * 应用启动时调用：请求 /app/ip_region，并同步 i18n 语言。
 * 1. 接口有 region → 映射并持久化
 * 2. 接口无 region → 设备地区（MOCK_DEVICE_REGION / OS regionCode）
 * 3. 请求失败 → 复用缓存，否则同上；设备无 region → OTHER（en）
 */
export function bootstrapAccountRegion(): Promise<AccountRegion> {
  if (regionReady) {
    return Promise.resolve(getAccountRegion())
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const cached = readStoredAccountRegion()
      if (cached) {
        resolvedRegion = cached
        syncLanguageToRegion(cached)
        regionReady = true
        return cached
      }
      const ipResult = await fetchIPRegionIso()
      const region = resolveRegionFromBootstrap(ipResult, cached)

      resolvedRegion = region
      if (typeof ipResult === 'string' && ipResult !== 'empty') {
        persistAccountRegion(region)
      }
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
