import type { AccountRegion } from '@/features/auth/auth-types'
import {
  DEFAULT_ACCOUNT_REGION,
  getDeviceAccountRegion,
  mapCountryCodeToAccountRegion,
} from '@/features/auth/region-config'
import { API_BASE, IP_REGION_PATH } from '@/shared/api/api-base'
import { buildLocaleHeaders } from '@/shared/api/locale-headers'
import { buildRequestSignHeaders } from '@/shared/api/request-sign'
import { storage } from '@/shared/storage'

export const ACCOUNT_REGION_STORAGE_KEY = 'popop-account-region'

let regionReady = false
let bootstrapPromise: Promise<AccountRegion> | null = null
let resolvedRegion: AccountRegion | null = null
let userOverride: AccountRegion | null = null

function isAccountRegion(value: string): value is AccountRegion {
  return value === 'TW' || value === 'JP' || value === 'KR' || value === 'OTHER'
}

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

export function isAccountRegionReady(): boolean {
  return regionReady
}

export function getAccountRegion(): AccountRegion {
  return userOverride ?? resolvedRegion ?? readStoredAccountRegion() ?? DEFAULT_ACCOUNT_REGION
}

export function setAccountRegion(region: AccountRegion): void {
  userOverride = region
  resolvedRegion = region
  persistAccountRegion(region)
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

/**
 * 应用启动时调用：请求 /app/ip_region。
 * - 有返回值：映射后写入 storage，下次复用
 * - 无返回值：使用设备地区兜底（可用 MOCK_DEVICE_REGION 覆盖），不写入缓存
 * - 请求失败：复用已有缓存（若有），否则使用设备地区兜底
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
      }

      const result = await fetchIPRegionIso()

      if (typeof result === 'string') {
        resolvedRegion = mapCountryCodeToAccountRegion(result)
        persistAccountRegion(resolvedRegion)
      } else if (result === 'empty') {
        resolvedRegion = getDeviceAccountRegion()
      } else {
        resolvedRegion = cached ?? getDeviceAccountRegion()
      }

      regionReady = true
      return getAccountRegion()
    })().finally(() => {
      bootstrapPromise = null
    })
  }

  return bootstrapPromise
}

export function waitForAccountRegion(): Promise<AccountRegion> {
  return bootstrapAccountRegion()
}
