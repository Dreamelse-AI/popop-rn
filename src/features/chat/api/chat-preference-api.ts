import {
  getChatPreference as getChatPreferenceReal,
  setChatPreference as setChatPreferenceReal,
  type GetChatPreferenceResp,
  type SetChatPreferenceReq,
  type SetChatPreferenceResp,
} from '@/generated'

import { USE_MOCK } from './chat-api'
import * as mock from './chat-preference-api.mock'

export const chatPreferenceApi = {
  get: (characterSaveId: string): Promise<GetChatPreferenceResp> =>
    USE_MOCK
      ? mock.getChatPreferenceMock(characterSaveId)
      : getChatPreferenceReal({ character_save_id: characterSaveId }),

  set: (req: SetChatPreferenceReq): Promise<SetChatPreferenceResp> =>
    USE_MOCK ? mock.setChatPreferenceMock(req) : setChatPreferenceReal(req),
}
