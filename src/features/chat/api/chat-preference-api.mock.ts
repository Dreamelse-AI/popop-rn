import type {
  GetChatPreferenceResp,
  SetChatPreferenceReq,
  SetChatPreferenceResp,
} from '@/generated/arca_apiComponents';

const mockPreferenceByCharacter = new Map<string, GetChatPreferenceResp>();
const mockUserPromptByCharacter = new Map<string, string>();

const MOCK_MODELS = [
  { model_id: 'juice', name: 'Strawberry Milkshake', price: 20 },
  { model_id: 'shake', name: 'Classic Shake', price: 15 },
  { model_id: 'cocktail', name: 'Summer Cocktail', price: 25 },
  { model_id: 'bubble-tea', name: 'Bubble Tea', price: 18 },
] as const;

function createDefaultPreference(): GetChatPreferenceResp {
  return {
    options: {
      models: [...MOCK_MODELS],
      default_model_id: 'shake',
      temperature_min: 0,
      temperature_max: 2,
      temperature_default: 2,
    },
    current: {
      model_id: 'shake',
      temperature: 2,
      is_custom: false,
      background_url: '',
      bubble_key: '',
      user_prompt: '',
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
  const pref = getOrCreatePreference(characterId);
  const userPrompt = mockUserPromptByCharacter.get(characterId) ?? '';
  if (userPrompt) {
    return {
      ...pref,
      current: {
        ...pref.current,
        is_custom: true,
        user_prompt: userPrompt,
      },
    };
  }
  return pref;
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
    req.temperature >= 0 ? req.temperature : pref.current.temperature;
  const nextUserPrompt =
    req.user_prompt !== undefined
      ? req.user_prompt
      : (mockUserPromptByCharacter.get(req.character_id) ?? '');

  if (req.user_prompt !== undefined) {
    mockUserPromptByCharacter.set(req.character_id, req.user_prompt);
  }

  pref.current = {
    ...pref.current,
    model_id: nextModelId,
    temperature: nextTemperature,
    is_custom: Boolean(nextUserPrompt.trim()),
    user_prompt: nextUserPrompt,
    background_url: req.clear_background
      ? ''
      : (req.background_url ?? pref.current.background_url),
    bubble_key: req.clear_bubble ? '' : (req.bubble_key ?? pref.current.bubble_key),
  };

  mockPreferenceByCharacter.set(req.character_id, pref);

  return {
    character_save_id: `save-${req.character_id}`,
    model_id: pref.current.model_id,
    temperature: pref.current.temperature,
    background_url: pref.current.background_url,
    bubble_key: pref.current.bubble_key,
  };
}
