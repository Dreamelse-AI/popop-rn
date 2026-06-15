import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchPresetCharacterTags } from '../api/character-page-config-api';
import {
  appendCustomCharacterTag,
  loadCustomCharacterTags,
  mergeTagOptions,
} from '../lib/custom-tag-store';

type UseCharacterTagOptionsResult = {
  options: string[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  addCustomTag: (tag: string) => string | null;
};

export function useCharacterTagOptions(
  enabled = true,
  selectedTags: string[] = [],
): UseCharacterTagOptionsResult {
  const [presetTags, setPresetTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>(() => loadCustomCharacterTags());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const tags = await fetchPresetCharacterTags();
      setPresetTags(tags);
      setCustomTags(loadCustomCharacterTags());
    } catch (e) {
      console.error('[useCharacterTagOptions] refresh failed:', e);
      setError(true);
      setCustomTags(loadCustomCharacterTags());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const addCustomTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return null;
    const next = appendCustomCharacterTag(trimmed);
    setCustomTags(next);
    return trimmed;
  }, []);

  const options = useMemo(
    () => mergeTagOptions(customTags, selectedTags, presetTags),
    [customTags, selectedTags, presetTags],
  );

  return { options, loading, error, refresh, addCustomTag };
}
