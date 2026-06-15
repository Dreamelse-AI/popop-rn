import {
  findBackground,
  type ChatAtmosphereConfig,
} from '../lib/chat-atmosphere-presets';
import { saveChatAtmosphereLocal } from '../lib/chat-atmosphere-store';

/** 提交给后端的聊天氛围配置（接口就绪后可直接对接） */
export type SaveChatAtmosphereReq = {
  character_id: string;
  background_id: string;
  bubble_style_id: string;
  custom_theme_id: string;
  custom_background_url?: string;
  bkg_main_color?: string;
};

function toSavePayload(characterId: string, config: ChatAtmosphereConfig): SaveChatAtmosphereReq {
  const background = findBackground(config.backgroundId);
  const payload: SaveChatAtmosphereReq = {
    character_id: characterId,
    background_id: config.backgroundId,
    bubble_style_id: config.bubbleStyleId,
    custom_theme_id: config.customThemeId,
  };

  if (background?.type === 'image' || background?.type === 'custom') {
    payload.custom_background_url = background.image;
    if (background.bkgMainColor) {
      payload.bkg_main_color = background.bkgMainColor;
    }
  }

  return payload;
}

/**
 * 保存聊天氛围设置：先写入前端本地，再尝试同步后端。
 * 后端接口未就绪时仅本地持久化，并在控制台输出待对接 payload。
 */
export async function saveChatAtmosphereSettings(
  characterId: string,
  config: ChatAtmosphereConfig,
): Promise<SaveChatAtmosphereReq> {
  saveChatAtmosphereLocal(characterId, config);
  const payload = toSavePayload(characterId, config);

  // TODO: 对接后端 save chat atmosphere API
  if (__DEV__) {
    console.info('[chat-atmosphere] pending backend sync', payload);
  }

  return payload;
}
