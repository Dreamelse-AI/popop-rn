import type { AppTermsResp } from '@/generated/arca_apiComponents';
import { API_BASE } from '@/shared/api/api-base';
import { buildLocaleHeaders } from '@/shared/api/locale-headers';
import { buildRequestSignHeaders } from '@/shared/api/request-sign';

import type { AccountRegion, AgreementKey } from '../auth-types';
import { REGION_TO_LANGUAGE } from '../region-config';

const TERMS_PATH = '/app/terms';

export type AppTermsLinks = Partial<Record<AgreementKey, string>>;

function mapTermsResponse(resp: AppTermsResp): AppTermsLinks {
  const links: AppTermsLinks = {};

  if (resp.user_agreement) {
    links.terms = resp.user_agreement;
  }
  if (resp.privacy_policy) {
    links.privacy = resp.privacy_policy;
  }
  if (resp.xhs) {
    links.personalInfoConsent = resp.xhs;
  }

  return links;
}

async function requestTermsForRegion(region: AccountRegion): Promise<AppTermsResp> {
  const method = 'GET';
  const bodyString = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...buildLocaleHeaders(REGION_TO_LANGUAGE[region], region),
    ...(await buildRequestSignHeaders(method, TERMS_PATH, bodyString)),
  };

  const res = await fetch(`${API_BASE}${TERMS_PATH}`, {
    method,
    headers,
    body: undefined,
  });

  const json = await res.json().catch(() => null) as {
    code?: number;
    msg?: string;
    data?: AppTermsResp | null;
  } | null;

  if (!res.ok || !json || json.code !== 0 || !json.data) {
    throw new Error(json?.msg ?? 'Failed to load terms');
  }

  return json.data;
}

const cache = new Map<AccountRegion, AppTermsLinks>();
const inflight = new Map<AccountRegion, Promise<AppTermsLinks>>();

export function fetchAppTermsLinks(region: AccountRegion): Promise<AppTermsLinks> {
  const cached = cache.get(region);
  if (cached) {
    return Promise.resolve(cached);
  }

  let promise = inflight.get(region);
  if (!promise) {
    promise = requestTermsForRegion(region)
      .then(resp => {
        const links = mapTermsResponse(resp);
        cache.set(region, links);
        return links;
      })
      .finally(() => {
        inflight.delete(region);
      });
    inflight.set(region, promise);
  }

  return promise;
}

export function getCachedAppTermsLinks(region: AccountRegion): AppTermsLinks | null {
  return cache.get(region) ?? null;
}
