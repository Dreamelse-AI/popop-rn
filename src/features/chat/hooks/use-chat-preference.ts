import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ChatModelOption } from '@/generated/arca_apiComponents';

import { useFriendshipStore } from '@/features/friendship/store/friendship-store';

import { buildSetChatPreferenceReq, chatPreferenceApi } from '../api/chat-preference-api';
import {
  clampTemperature,
  COLLAPSED_MODEL_COUNT,
  CUSTOM_INSTRUCTIONS_MAX_LENGTH,
  DEFAULT_TEMPERATURE,
  toChatModelDisplay,
  type ChatModelDisplay,
} from '../lib/chat-model-display';
import {
  getCharacterUserPrompt,
  getChatModelSessionConfig,
  migratePendingSessionConfig,
  pendingCharacterSaveId,
  resolveModelConfig,
  setCharacterUserPrompt,
  setChatModelSessionConfig,
} from '../lib/chat-model-session-store';
import type { ChatModeCustomSettings } from '../ui/chat-mode-custom-sheet';

type UseChatPreferenceOptions = {
  characterId: string;
  enabled: boolean;
  onApplied?: () => void;
};

function resolveCharacterSaveId(characterId: string, fromApi?: string): string {
  if (fromApi) return fromApi;
  const friend = useFriendshipStore
    .getState()
    .friends.find(item => item.character_id === characterId);
  return friend?.current_character_save_id ?? pendingCharacterSaveId(characterId);
}

export function useChatPreference({ characterId, enabled, onApplied }: UseChatPreferenceOptions) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [models, setModels] = useState<ChatModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [defaultTemperatureLevel, setDefaultTemperatureLevel] = useState(DEFAULT_TEMPERATURE);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const characterSaveIdRef = useRef<string>(pendingCharacterSaveId(characterId));
  const defaultTemperatureRef = useRef(DEFAULT_TEMPERATURE);

  const displayModels = useMemo(
    () => models.map(model => toChatModelDisplay(model, t)),
    [models, t],
  );

  const visibleModels = useMemo(
    () => (expanded ? displayModels : displayModels.slice(0, COLLAPSED_MODEL_COUNT)),
    [displayModels, expanded],
  );

  const canExpand = displayModels.length > COLLAPSED_MODEL_COUNT;

  const refresh = useCallback(async () => {
    if (!characterId) return;
    setLoading(true);
    setError(false);
    try {
      const saveId = resolveCharacterSaveId(characterId);
      characterSaveIdRef.current = saveId;
      const resp = await chatPreferenceApi.get(saveId);

      const temperatureDefault = clampTemperature(
        resp.options.temperature_default ?? DEFAULT_TEMPERATURE,
      );
      defaultTemperatureRef.current = temperatureDefault;
      setDefaultTemperatureLevel(temperatureDefault);
      setModels(resp.options.models ?? []);

      const activeModelId = resp.current.model_id || resp.options.default_model_id;
      setSelectedModelId(activeModelId);

      if (activeModelId) {
        const existing = getChatModelSessionConfig(characterSaveIdRef.current, activeModelId);
        if (!existing) {
          setChatModelSessionConfig(characterSaveIdRef.current, activeModelId, {
            temperatureLevel: clampTemperature(resp.current.temperature),
            customInstructions: getCharacterUserPrompt(characterSaveIdRef.current),
          });
        }
      }
    } catch (e) {
      console.error('[useChatPreference] load failed:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    characterSaveIdRef.current = pendingCharacterSaveId(characterId);
  }, [characterId]);

  useEffect(() => {
    if (!enabled || !characterId) return;
    void refresh();
  }, [characterId, enabled, refresh]);

  const updateSaveId = useCallback(
    (saveId: string) => {
      migratePendingSessionConfig(characterId, saveId);
      characterSaveIdRef.current = saveId;
    },
    [characterId],
  );

  const getModelSettings = useCallback(
    (modelId: string): ChatModeCustomSettings => {
      const saveId = characterSaveIdRef.current;
      const defaults = { temperatureLevel: defaultTemperatureRef.current };
      const config = resolveModelConfig(saveId, modelId, defaults);
      return {
        temperatureLevel: clampTemperature(config.temperatureLevel),
        customInstructions: config.customInstructions.slice(0, CUSTOM_INSTRUCTIONS_MAX_LENGTH),
      };
    },
    [],
  );

  const persistModelSettings = useCallback(
    async (modelId: string, settings: ChatModeCustomSettings) => {
      const saveId = characterSaveIdRef.current;
      const normalized: ChatModeCustomSettings = {
        temperatureLevel: clampTemperature(settings.temperatureLevel),
        customInstructions: settings.customInstructions.slice(0, CUSTOM_INSTRUCTIONS_MAX_LENGTH),
      };

      setChatModelSessionConfig(saveId, modelId, {
        temperatureLevel: normalized.temperatureLevel,
        customInstructions: normalized.customInstructions,
      });

      setSaving(true);
      try {
        const resp = await chatPreferenceApi.set(
          buildSetChatPreferenceReq({
            characterId,
            modelId,
            temperatureLevel: normalized.temperatureLevel,
            customInstructions: normalized.customInstructions,
          }),
        );
        updateSaveId(resp.character_save_id);
        setSelectedModelId(resp.model_id);
        setChatModelSessionConfig(characterSaveIdRef.current, resp.model_id, {
          temperatureLevel: clampTemperature(resp.temperature),
          customInstructions: normalized.customInstructions,
        });
        setCharacterUserPrompt(characterSaveIdRef.current, normalized.customInstructions);
        onApplied?.();
        return true;
      } catch (e) {
        console.error('[useChatPreference] save settings failed:', e);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [characterId, onApplied, updateSaveId],
  );

  const selectModel = useCallback(
    async (model: ChatModelDisplay) => {
      if (model.modelId === selectedModelId || saving) return false;

      const saveId = characterSaveIdRef.current;
      if (saveId && selectedModelId) {
        const currentSettings = getModelSettings(selectedModelId);
        setChatModelSessionConfig(saveId, selectedModelId, {
          temperatureLevel: currentSettings.temperatureLevel,
          customInstructions: currentSettings.customInstructions,
        });
      }

      const targetSettings = getModelSettings(model.modelId);
      setSaving(true);
      try {
        const resp = await chatPreferenceApi.set(
          buildSetChatPreferenceReq({
            characterId,
            modelId: model.modelId,
            temperatureLevel: targetSettings.temperatureLevel,
            customInstructions: targetSettings.customInstructions,
          }),
        );
        updateSaveId(resp.character_save_id);
        setSelectedModelId(resp.model_id);
        setChatModelSessionConfig(characterSaveIdRef.current, model.modelId, {
          temperatureLevel: clampTemperature(resp.temperature),
          customInstructions: targetSettings.customInstructions,
        });
        setCharacterUserPrompt(characterSaveIdRef.current, targetSettings.customInstructions);
        onApplied?.();
        return true;
      } catch (e) {
        console.error('[useChatPreference] select model failed:', e);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [
      characterId,
      getModelSettings,
      onApplied,
      saving,
      selectedModelId,
      updateSaveId,
    ],
  );

  return {
    loading,
    error,
    saving,
    models: displayModels,
    visibleModels,
    selectedModelId,
    defaultTemperatureLevel,
    expanded,
    canExpand,
    setExpanded,
    refresh,
    selectModel,
    getModelSettings,
    persistModelSettings,
  };
}
