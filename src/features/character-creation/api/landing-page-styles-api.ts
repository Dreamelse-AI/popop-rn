import type { AppearanceStyleItem } from '@/generated/arca_apiComponents';

import {
  fetchCharacterPageConfig,
  resetCharacterPageConfigCache,
} from './character-page-config-api';

/** Landing page style covers are delivered by `/character/page_config`. */
export async function fetchLandingPageStyles(): Promise<AppearanceStyleItem[]> {
  const resp = await fetchCharacterPageConfig();
  return resp.landing_page_styles ?? [];
}

export function resetLandingPageStylesCache() {
  resetCharacterPageConfigCache();
}
