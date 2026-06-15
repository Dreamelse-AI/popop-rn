import { useEffect, useState } from 'react';

import type { AccountRegion } from '../auth-types';
import { fetchAppTermsLinks, getCachedAppTermsLinks, type AppTermsLinks } from '../lib/app-terms';

export function useAppTerms(region: AccountRegion) {
  const [links, setLinks] = useState<AppTermsLinks>(() => getCachedAppTermsLinks(region) ?? {});

  useEffect(() => {
    let alive = true;

    setLinks(getCachedAppTermsLinks(region) ?? {});

    fetchAppTermsLinks(region)
      .then(result => {
        if (alive) {
          setLinks(result);
        }
      })
      .catch(err => {
        console.error('[useAppTerms] failed to load terms:', err);
        if (alive) {
          setLinks({});
        }
      });

    return () => {
      alive = false;
    };
  }, [region]);

  return links;
}
