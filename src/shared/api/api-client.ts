import { AppState } from 'react-native'
import { isAccountRegionReady, waitForAccountRegion } from '@/shared/api/account-region-store'
import { API_BASE, IP_REGION_PATH } from '@/shared/api/api-base'
import { API_CODE, ApiError, InsufficientBalanceError } from '@/shared/api/api-errors'
import { buildLocaleHeaders } from '@/shared/api/locale-headers'
import { buildRequestSignHeaders } from '@/shared/api/request-sign'

export { ApiError } from '@/shared/api/api-errors'
export { API_BASE } from '@/shared/api/api-base'

const DEFAULT_TIMEOUT_MS = 15_000

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
  body?: unknown
  headers?: Record<string, string>
  keepalive?: boolean
  timeoutMs?: number
}

type ApiEnvelope<T> = {
  code: number
  msg: string
  data: T | null
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(401, message)
    this.name = 'UnauthorizedError'
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network unavailable') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`)
    this.name = 'TimeoutError'
  }
}

function isOnline(): boolean {
  return AppState.currentState === 'active'
}

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer)
  })
}

type OnUnauthorizedCallback = () => void

class ApiClient {
  #baseUrl: string
  #token: string | null = null
  #onUnauthorized: OnUnauthorizedCallback | null = null

  constructor(baseUrl: string) {
    this.#baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.#token = token
  }

  getToken() {
    return this.#token
  }

  onUnauthorized(callback: OnUnauthorizedCallback) {
    this.#onUnauthorized = callback
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!isOnline()) {
      throw new NetworkError()
    }

    if (path !== IP_REGION_PATH && !isAccountRegionReady()) {
      await waitForAccountRegion()
    }

    const { method = 'POST', body, headers = {}, keepalive, timeoutMs = DEFAULT_TIMEOUT_MS } = options

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
      ...buildLocaleHeaders(),
    }

    if (this.#token) {
      reqHeaders.Authorization = `Bearer ${this.#token}`
    }

    const bodyString = body ? JSON.stringify(body) : ''
    Object.assign(reqHeaders, await buildRequestSignHeaders(method, path, bodyString))

    let res: Response
    try {
      const url = `${this.#baseUrl}${path}`
      console.log(`[API] ${method} ${url}`, { headers: reqHeaders, body: bodyString?.slice(0, 200) })
      res = await fetchWithTimeout(
        url,
        {
          method,
          headers: reqHeaders,
          body: bodyString || undefined,
          keepalive,
        },
        timeoutMs,
      )
      console.log(`[API] ${method} ${path} -> ${res.status}`)
    } catch (err: unknown) {
      console.error(`[API] ${method} ${path} FAILED:`, err)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new TimeoutError(timeoutMs)
      }
      throw new NetworkError(err instanceof Error ? err.message : 'Network request failed')
    }

    if (res.status === 401) {
      this.#onUnauthorized?.()
      throw new UnauthorizedError('Session expired')
    }

    const json = await res.json().catch(() => null) as ApiEnvelope<T> | null

    if (!res.ok) {
      throw new ApiError(res.status, json?.msg ?? res.statusText)
    }

    if (!json) {
      throw new ApiError(res.status, 'Empty response')
    }

    if (json.code !== 0) {
      const message = json.msg || 'Request failed'
      if (json.code === API_CODE.INSUFFICIENT_BALANCE) {
        throw new InsufficientBalanceError(message)
      }
      throw new ApiError(json.code, message)
    }

    return json.data as T
  }
}

export const apiClient = new ApiClient(API_BASE)
