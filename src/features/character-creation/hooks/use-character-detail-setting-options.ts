import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchCharacterPageConfig,
  mapPageConfigDetailSettingOptions,
  type DetailSettingOption,
} from '../api/character-page-config-api';
import {
  appendCustomSettingCategory,
  loadCustomSettingCategories,
  mergeDetailSettingOptions,
} from '../lib/custom-setting-store';

export function useCharacterDetailSettingOptions(enabled = true) {
  const [presetOptions, setPresetOptions] = useState<DetailSettingOption[]>([]);
  const [customCategories, setCustomCategories] = useState(() => loadCustomSettingCategories());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetchCharacterPageConfig();
      setPresetOptions(mapPageConfigDetailSettingOptions(resp.setting_options));
      setCustomCategories(loadCustomSettingCategories());
    } catch (e) {
      console.error('[useCharacterDetailSettingOptions] refresh failed:', e);
      setPresetOptions([]);
      setCustomCategories(loadCustomSettingCategories());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const options = useMemo(
    () => mergeDetailSettingOptions(presetOptions, customCategories),
    [presetOptions, customCategories],
  );

  const addCustomCategory = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return null;
    const next = appendCustomSettingCategory(trimmed);
    setCustomCategories(next);
    return next.find((item) => item.label === trimmed) ?? null;
  }, []);

  return { options, loading, refresh, addCustomCategory };
}
