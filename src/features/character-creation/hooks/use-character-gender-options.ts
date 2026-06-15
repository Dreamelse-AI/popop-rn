import { useCallback, useEffect, useState } from 'react';

import { fetchGenderOptions } from '../api/character-page-config-api';

export type ResolvedSelectOption<T extends string = string> = {
  value: T;
  emoji: string;
  label: string;
};

export function useCharacterGenderOptions(enabled = true) {
  const [options, setOptions] = useState<ResolvedSelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setOptions(await fetchGenderOptions());
    } catch (e) {
      console.error('[useCharacterGenderOptions] refresh failed:', e);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { options, loading, refresh };
}
