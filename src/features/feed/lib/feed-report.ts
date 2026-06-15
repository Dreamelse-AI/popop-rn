import { feedItemReport, type ItemReportEntity } from '@/generated'

import type { HomeFeedPromo } from '../feed-types'

function reportPromo(promo: HomeFeedPromo, action: 'show' | 'click') {
  const item = {
    impression_id: promo.impressionId,
    entity_type: 'promo',
    entity_id: promo.promoId,
  } satisfies ItemReportEntity

  void feedItemReport({
    source: 'rec',
    action,
    list: [item],
  }).catch((error: unknown) => {
    console.error('[feed-report] promo report failed:', error)
  })
}

export function reportFeedPromoShow(promo: HomeFeedPromo) {
  reportPromo(promo, 'show')
}

export function reportFeedPromoClick(promo: HomeFeedPromo) {
  reportPromo(promo, 'click')
}
