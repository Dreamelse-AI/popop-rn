import type { CharacterCreateForm } from '@/generated/arca_apiComponents';
import { getCharacterDetail } from '@/generated/arca_api';

import * as mock from '../api/character-creation-api.mock';
import { USE_CHARACTER_CREATION_MOCK } from '../config';
import { mapCharacterDetailToCreateForm } from './form-mapper';

const EMPTY_PUBLISHED_FORM: CharacterCreateForm = { landing_page_urls: [] };

/** 从已发布角色拉取创作表单快照（Mock / 真实接口统一入口） */
export async function loadPublishedCharacterCreateForm(
  characterId: string,
): Promise<CharacterCreateForm> {
  if (USE_CHARACTER_CREATION_MOCK) {
    return mock.getPublishedCharacterCreateForm(characterId);
  }

  try {
    const detail = await getCharacterDetail({ character_id: characterId, source: 'direct' });
    return mapCharacterDetailToCreateForm(detail.character);
  } catch (error) {
    console.warn('[loadPublishedCharacterCreateForm] load failed:', error);
    return EMPTY_PUBLISHED_FORM;
  }
}
