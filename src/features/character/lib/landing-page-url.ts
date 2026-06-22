import { getAccountRegion } from '@/shared/api/account-region-store'
import { buildLocaleHeaders } from '@/shared/api/locale-headers'

export type LandingPageLocaleQueryOptions = {
  /** 顶导占位高度（px），告知落地页顶部留白 */
  navHeight?: number
}

/** 为 landing page CDN URL 追加 region / language / navHeight 等查询参数 */
export function appendLandingPageLocaleQuery(
  url: string,
  options: LandingPageLocaleQueryOptions = {},
): string {
  if (!url.startsWith('http')) return url

  try {
    const parsed = new URL(url)
    const localeHeaders = buildLocaleHeaders(getAccountRegion())
    parsed.searchParams.set('region', localeHeaders['X-Region'])
    parsed.searchParams.set('language', localeHeaders['X-Language'])
    if (options.navHeight != null && options.navHeight > 0) {
      parsed.searchParams.set('navHeight', String(Math.round(options.navHeight)))
    }
    return parsed.toString()
  } catch {
    return url
  }
}
