import {
  getChatPreference as getChatPreferenceReal,
  setChatPreference as setChatPreferenceReal,
  type GetChatPreferenceResp,
  type SetChatPreferenceReq,
  type SetChatPreferenceResp,
} from '@/generated'

import { USE_MOCK } from './chat-api'
import * as mock from './chat-preference-api.mock'

export type SetChatPreferenceInput = {
  characterId: string
  modelId: string
  temperatureLevel: number
  customInstructions: string
}

export function buildSetChatPreferenceReq({
  characterId,
  modelId,
  temperatureLevel,
}: SetChatPreferenceInput): SetChatPreferenceReq {
  return {
    character_id: characterId,
    model_id: modelId,
    temperature: temperatureLevel,
  }
}

export const chatPreferenceApi = {
  get: (characterSaveId: string): Promise<GetChatPreferenceResp> =>
    USE_MOCK
      ? mock.getChatPreferenceMock(characterSaveId)
      : getChatPreferenceReal({ character_save_id: characterSaveId }),

  set: (req: SetChatPreferenceReq): Promise<SetChatPreferenceResp> =>
    USE_MOCK ? mock.setChatPreferenceMock(req) : setChatPreferenceReal(req),
}
