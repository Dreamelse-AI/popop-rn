import type { CharacterCreateForm } from '@/generated/arca_apiComponents';
import { getCharacterDetail } from '@/generated/arca_api';

import * as mock from '../api/character-creation-api.mock';
import {
  buildPageConfigLookups,
  fetchCharacterPageConfig,
} from '../api/character-page-config-api';
import { USE_CHARACTER_CREATION_MOCK } from '../config';
import { mapCharacterDetailToCreateForm } from './form-mapper';

const EMPTY_PUBLISHED_FORM: CharacterCreateForm = {};

/** 从已发布角色拉取创作表单快照（Mock / 真实接口统一入口） */
export async function loadPublishedCharacterCreateForm(
  characterId: string,
): Promise<CharacterCreateForm> {
  if (USE_CHARACTER_CREATION_MOCK) {
    return mock.getPublishedCharacterCreateForm(characterId);
  }

  try {
    const [detail, pageConfig] = await Promise.all([
      getCharacterDetail({ character_id: characterId, source: 'direct' }),
      fetchCharacterPageConfig().catch(() => null),
    ]);
    const lookups = pageConfig ? buildPageConfigLookups(pageConfig) : undefined;
    return mapCharacterDetailToCreateForm(detail.character, lookups);
  } catch (error) {
    console.warn('[loadPublishedCharacterCreateForm] load failed:', error);
    return EMPTY_PUBLISHED_FORM;
  }
}
