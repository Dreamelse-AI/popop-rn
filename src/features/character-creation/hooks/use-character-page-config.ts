import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchCharacterPageConfig,
  mapPageConfigGenderOptions,
  mapPageConfigSpeciesOptions,
  mapPageConfigTags,
  mapPageConfigVisibilityOptions,
  resetCharacterPageConfigCache,
} from '../api/character-page-config-api';
import type { GetCharacterPageConfigResp } from '@/generated/arca_apiComponents';

export function useCharacterPageConfig(enabled = true) {
  const [config, setConfig] = useState<GetCharacterPageConfigResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    resetCharacterPageConfigCache();
    setLoading(true);
    setError(false);
    try {
      const resp = await fetchCharacterPageConfig();
      setConfig(resp);
    } catch (e) {
      console.error('[useCharacterPageConfig] refresh failed:', e);
      setConfig(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const genderOptions = useMemo(
    () => mapPageConfigGenderOptions(config?.genders),
    [config?.genders],
  );
  const speciesOptions = useMemo(
    () => mapPageConfigSpeciesOptions(config?.species),
    [config?.species],
  );
  const visibilityOptions = useMemo(
    () => mapPageConfigVisibilityOptions(config?.setting_options),
    [config?.setting_options],
  );
  const presetTags = useMemo(() => (config ? mapPageConfigTags(config) : []), [config]);

  return {
    config,
    loading,
    error,
    genderOptions,
    speciesOptions,
    visibilityOptions,
    presetTags,
    refresh,
  };
}
