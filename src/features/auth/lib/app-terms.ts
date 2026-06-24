import type { AppTermsResp, TermsInfo } from '@/generated/arca_apiComponents';
import { API_BASE } from '@/shared/api/api-base';
import { buildLocaleHeaders } from '@/shared/api/locale-headers';
import { buildRequestSignHeaders } from '@/shared/api/request-sign';

import type { AccountRegion } from '../auth-types';

const TERMS_PATH = '/app/terms';

export type { TermsInfo };

function mapTermsResponse(resp: AppTermsResp): TermsInfo[] {
  return resp.terms_list ?? [];
}

export function getRequiredTerms(terms: TermsInfo[]): TermsInfo[] {
  return terms.filter(term => term.required);
}

export function canSubmitTerms(
  terms: TermsInfo[],
  checks: Partial<Record<string, boolean>>,
): boolean {
  return getRequiredTerms(terms).every(term => checks[term.terms_id]);
}

async function requestTermsForRegion(region: AccountRegion): Promise<TermsInfo[]> {
  const method = 'GET';
  const bodyString = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...buildLocaleHeaders(region),
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

  return mapTermsResponse(json.data);
}

const inflight = new Map<AccountRegion, Promise<TermsInfo[]>>();

export function fetchAppTerms(region: AccountRegion): Promise<TermsInfo[]> {
  let promise = inflight.get(region);
  if (!promise) {
    promise = requestTermsForRegion(region)
      .finally(() => {
        inflight.delete(region);
      });
    inflight.set(region, promise);
  }

  return promise;
}
