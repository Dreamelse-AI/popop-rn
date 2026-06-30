import type { SetChatPreferenceReq } from '@/generated/arca_apiComponents';

import { chatPreferenceApi } from './chat-preference-api';
import {
  decodeAtmospherePreference,
  encodeAtmospherePreferenceFields,
} from '../lib/chat-atmosphere-preference';
import type { ChatAtmosphereConfig } from '../lib/chat-atmosphere-presets';
import { saveChatAtmosphereLocal } from '../lib/chat-atmosphere-store';
import { resolveCharacterSaveId } from '../lib/resolve-character-save-id';

/** 仅同步氛围配置时不修改温度：-1 表示「不修改」 */
const ATMOSPHERE_ONLY_TEMPERATURE = -1;

function buildSetAtmosphereReq(
  characterId: string,
  config: ChatAtmosphereConfig,
): SetChatPreferenceReq {
  return {
    character_id: characterId,
    temperature: ATMOSPHERE_ONLY_TEMPERATURE,
    ...encodeAtmospherePreferenceFields(config),
  };
}

/** 从后端拉取并合并聊天氛围配置（失败时返回 null） */
export async function loadChatAtmosphereFromServer(
  characterId: string,
): Promise<ChatAtmosphereConfig | null> {
  if (!characterId) return null;

  try {
    const characterSaveId = await resolveCharacterSaveId(characterId);
    const resp = await chatPreferenceApi.get(characterSaveId);
    const config = decodeAtmospherePreference(
      resp.current.background_url,
      resp.current.bubble_key,
    );
    saveChatAtmosphereLocal(characterId, config);
    return config;
  } catch (error) {
    if (__DEV__) {
      console.error('[chat-atmosphere] load from server failed:', error);
    }
    return null;
  }
}

/**
 * 保存聊天氛围设置：先写入前端本地，再同步后端 chat_preference/set。
 * 参考 popop-fe saveChatAtmosphereSettings 实现。
 */
export async function saveChatAtmosphereSettings(
  characterId: string,
  config: ChatAtmosphereConfig,
): Promise<ChatAtmosphereConfig> {
  saveChatAtmosphereLocal(characterId, config);

  if (!characterId) return config;

  const resp = await chatPreferenceApi.set(buildSetAtmosphereReq(characterId, config));
  const synced = decodeAtmospherePreference(resp.background_url, resp.bubble_key);
  saveChatAtmosphereLocal(characterId, synced);
  return synced;
}
