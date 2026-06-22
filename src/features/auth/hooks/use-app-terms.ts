import type { TermsInfo } from '@/generated/arca_apiComponents';
import { useEffect, useState } from 'react';

import type { AccountRegion } from '../auth-types';
import { fetchAppTerms, getCachedAppTerms } from '../lib/app-terms';

export function useAppTerms(region: AccountRegion) {
  const [termsList, setTermsList] = useState<TermsInfo[]>(() => getCachedAppTerms(region) ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    setTermsList(getCachedAppTerms(region) ?? []);
    setError(null);

    fetchAppTerms(region)
      .then(result => {
        if (alive) {
          setTermsList(result);
          setError(null);
        }
      })
      .catch(err => {
        console.error('[useAppTerms] failed to load terms:', err);
        if (alive) {
          setTermsList([]);
          setError(err instanceof Error ? err.message : 'Failed to load terms');
        }
      });

    return () => {
      alive = false;
    };
  }, [region]);

  return { termsList, error };
}
