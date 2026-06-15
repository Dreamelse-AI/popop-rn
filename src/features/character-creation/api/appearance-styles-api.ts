import {
  fetchCharacterPageConfig,
  resetCharacterPageConfigCache,
} from './character-page-config-api';

export type AppearanceStyleItem = {
  style_key: string;
  style_name: string;
  style_icon?: { id: string; url: string; media_type: string };
};

/** 画风列表来自 `/character/page_config` 的 `appearance_styles` 字段
 *  注意：RN 生成类型中尚未包含此字段，从 resp 中动态读取
 */
export async function fetchAppearanceStyles(): Promise<AppearanceStyleItem[]> {
  const resp = await fetchCharacterPageConfig();
  return (resp as unknown as Record<string, unknown>)['appearance_styles'] as AppearanceStyleItem[] ?? [];
}

export function resetAppearanceStylesCache() {
  resetCharacterPageConfigCache();
}
