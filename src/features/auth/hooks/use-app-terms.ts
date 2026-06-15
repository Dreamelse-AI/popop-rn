import type { TermsInfo } from '@/generated/arca_apiComponents';
import { useEffect, useState } from 'react';

import type { AccountRegion } from '../auth-types';
import { fetchAppTerms, getCachedAppTerms } from '../lib/app-terms';

export function useAppTerms(region: AccountRegion) {
  const [termsList, setTermsList] = useState<TermsInfo[]>(() => getCachedAppTerms(region) ?? []);

  useEffect(() => {
    let alive = true;

    setTermsList(getCachedAppTerms(region) ?? []);

    fetchAppTerms(region)
      .then(result => {
        if (alive) {
          setTermsList(result);
        }
      })
      .catch(err => {
        console.error('[useAppTerms] failed to load terms:', err);
        if (alive) {
          setTermsList([]);
        }
      });

    return () => {
      alive = false;
    };
  }, [region]);

  return termsList;
}
