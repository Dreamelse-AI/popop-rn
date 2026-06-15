import { storage } from '@/shared/storage'
import {
  FEED_PROMO_MAX_EXPOSURES_PER_USER,
  FEED_PROMO_MIN_POSTS_INTERVAL,
} from './feed-layout-config'

const STORAGE_KEY = 'arca_feed_promo_exposure'

type PromoExposureMap = Record<string, { count: number; lastSeenAt: number }>

function readExposureMap(): PromoExposureMap {
  try {
    const raw = storage.get(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PromoExposureMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeExposureMap(map: PromoExposureMap) {
  storage.set(STORAGE_KEY, JSON.stringify(map))
}

export function canShowPromoByExposureLimit(promoId: string): boolean {
  const record = readExposureMap()[promoId]
  if (!record) return true
  return record.count < FEED_PROMO_MAX_EXPOSURES_PER_USER
}

export function recordPromoExposure(promoId: string) {
  const map = readExposureMap()
  const prev = map[promoId]
  map[promoId] = {
    count: (prev?.count ?? 0) + 1,
    lastSeenAt: Date.now(),
  }
  writeExposureMap(map)
}

export function getPromoMinPostsInterval(): number {
  return FEED_PROMO_MIN_POSTS_INTERVAL
}
