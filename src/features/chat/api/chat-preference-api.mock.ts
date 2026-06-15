import type {
  GetChatPreferenceResp,
  SetChatPreferenceReq,
  SetChatPreferenceResp,
} from '@/generated/arca_apiComponents';

const mockPreferenceByCharacter = new Map<string, GetChatPreferenceResp>();

const MOCK_MODELS = [
  { model_id: 'juice', name: 'Strawberry Milkshake' },
  { model_id: 'shake', name: 'Classic Shake' },
  { model_id: 'cocktail', name: 'Summer Cocktail' },
  { model_id: 'bubble-tea', name: 'Bubble Tea' },
] as const;

function createDefaultPreference(): GetChatPreferenceResp {
  return {
    options: {
      models: [...MOCK_MODELS],
      default_model_id: 'shake',
      temperature_default_level: 2,
    },
    current: {
      model_id: 'shake',
      temperature_level: 2,
      is_custom: false,
      background_url: '',
      bubble_key: '',
    },
  };
}

function getOrCreatePreference(characterId: string): GetChatPreferenceResp {
  if (!mockPreferenceByCharacter.has(characterId)) {
    mockPreferenceByCharacter.set(characterId, createDefaultPreference());
  }
  return structuredClone(mockPreferenceByCharacter.get(characterId)!);
}

export async function getChatPreferenceMock(characterId: string): Promise<GetChatPreferenceResp> {
  await new Promise<void>(resolve => {
    setTimeout(resolve, 200);
  });
  return getOrCreatePreference(characterId);
}

export async function setChatPreferenceMock(
  req: SetChatPreferenceReq,
): Promise<SetChatPreferenceResp> {
  await new Promise<void>(resolve => {
    setTimeout(resolve, 200);
  });

  const pref = getOrCreatePreference(req.character_id);
  const nextModelId = req.model_id ?? pref.current.model_id;
  const nextTemperature =
    req.temperature_level !== undefined
      ? req.temperature_level
      : pref.current.temperature_level;

  pref.current = {
    ...pref.current,
    model_id: nextModelId,
    temperature_level: nextTemperature,
    background_url: req.clear_background
      ? ''
      : (req.background_url ?? pref.current.background_url),
    bubble_key: req.clear_bubble ? '' : (req.bubble_key ?? pref.current.bubble_key),
  };

  mockPreferenceByCharacter.set(req.character_id, pref);

  return {
    character_save_id: `save-${req.character_id}`,
    model_id: pref.current.model_id,
    temperature_level: pref.current.temperature_level,
    background_url: pref.current.background_url,
    bubble_key: pref.current.bubble_key,
  };
}
