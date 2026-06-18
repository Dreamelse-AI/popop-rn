import type {
  CharacterCreateForm,
  CharacterDetailInfo,
  CharacterDraftDetail,
  CharacterDraftItem,
  GenLandingPageReq,
  LandingPageStyleConfig,
  UserUploadImage,
} from '@/generated/arca_apiComponents';

import type { PageConfigLookups } from '../api/character-page-config-api';
import {
  normalizeStoredSpeciesKey,
  normalizeStoredTagKeys,
} from '../api/character-page-config-api';
import type { CharacterDraftFormState, CreationFormImage } from '../types/form';
import { createEmptyDraftFormState, normalizeDraftFormState, normalizeVisibility } from '../types/form';
import { normalizeAppearanceImageTags } from './appearance-image-tags';

/** 服务端 UserUploadImage 扩展 tags 字段（生成类型尚未包含） */
type UserUploadImagePayload = UserUploadImage & { tags?: string[] };

function readImageTags(img: UserUploadImagePayload): string[] {
  return normalizeAppearanceImageTags(img.tags ?? []);
}

function mapImagesFromApi(
  images: CharacterCreateForm['images'],
): CreationFormImage[] {
  if (!images?.length) return [];
  return images.map((img, index) => {
    const payload = img as UserUploadImagePayload;
    return {
      id: `img_${index}`,
      url: payload.url,
      source: payload.image_type === 'aigc' ? 'aigc' : 'upload',
      isMain: payload.is_main_pic === true,
      tags: readImageTags(payload),
    };
  });
}

export function mapImagesToApi(images: CreationFormImage[]): CharacterCreateForm['images'] {
  if (!images.length) return undefined;
  return images.map((img) => {
    const tags = normalizeAppearanceImageTags(img.tags);
    const payload: UserUploadImagePayload = {
      name: '',
      image_type: img.source,
      url: img.url,
      is_main_pic: img.isMain,
      tags: tags.length ? tags : undefined,
    };
    return payload;
  });
}

export function apiFormToDraftState(
  draftId: string,
  form: CharacterCreateForm,
  serverUpdatedAt: number,
  lookups?: PageConfigLookups,
): CharacterDraftFormState {
  const customizedSettings = form.customized_settings
    ? Object.fromEntries(
        Object.entries(form.customized_settings)
          .map(([key, value]) => [key, value?.trim() ?? ''] as const)
          .filter(([, content]) => content.length > 0),
      )
    : {};

  const rawTags = form.tags ?? [];
  const rawSpecies = form.species?.trim() ?? '';
  const tags = lookups ? normalizeStoredTagKeys(rawTags, lookups) : rawTags;
  const species = lookups ? normalizeStoredSpeciesKey(rawSpecies, lookups) : rawSpecies;

  return normalizeDraftFormState({
    draftId,
    name: form.name?.trim() ?? '',
    tags,
    species,
    gender: form.gender ?? '',
    voiceId: form.voice_id ?? '',
    voiceName: '',
    profile: form.profile ?? '',
    disposition: form.disposition ?? '',
    anonymousTags: form.anonymous_tags ?? [],
    visibility: normalizeVisibility(form.visibility),
    images: mapImagesFromApi(form.images),
    openingPrologue: form.opening_prologue ?? [],
    customizedSettings,
    landingPageUrl: form.landing_page_url?.trim() ?? '',
    landingPagePrompt: form.landing_page_style?.user_prompt?.trim() ?? '',
    landingPageStyleKey: form.landing_page_style?.style_key?.trim() ?? '',
    localUpdatedAt: serverUpdatedAt,
    serverUpdatedAt,
  });
}

export function draftStateFromServerItem(draft: CharacterDraftItem): CharacterDraftFormState {
  const coverUrl = draft.media?.url?.trim();
  const images: CharacterDraftFormState['images'] = coverUrl
    ? [{ id: 'cover', url: coverUrl, source: 'upload', isMain: true, tags: [] }]
    : [];

  return {
    ...createEmptyDraftFormState(draft.draft_id, draft.updated_at ?? 0),
    name: draft.name?.trim() ?? '',
    images,
  };
}

export function draftStateFromDraftDetail(
  detail: CharacterDraftDetail,
  lookups?: PageConfigLookups,
): CharacterDraftFormState {
  return {
    ...apiFormToDraftState(
      detail.draft_id,
      detail.character_create_form ?? {},
      detail.updated_at ?? 0,
      lookups,
    ),
    targetCharacterId: detail.target_character_id,
  };
}

/** 仅比较表单业务字段（不含 draftId / 时间戳） */
export function serializeDraftFormContent(state: CharacterDraftFormState): string {
  return JSON.stringify(draftStateToApiForm(state));
}

export function isDraftFormContentEqual(
  a: CharacterDraftFormState,
  b: CharacterDraftFormState,
): boolean {
  return serializeDraftFormContent(a) === serializeDraftFormContent(b);
}

function buildLandingPageStyle(state: CharacterDraftFormState): LandingPageStyleConfig | undefined {
  const styleKey = state.landingPageStyleKey.trim();
  if (!styleKey) return undefined;

  const prompt = state.landingPagePrompt.trim();
  return {
    style_key: styleKey as LandingPageStyleConfig['style_key'],
    user_prompt: prompt || undefined,
  };
}

export function draftStateToApiForm(state: CharacterDraftFormState): CharacterCreateForm {
  const customizedEntries = Object.entries(state.customizedSettings)
    .map(([key, content]) => [key, content.trim()] as const)
    .filter(([, content]) => content.length > 0);
  const customized_settings =
    customizedEntries.length > 0 ? Object.fromEntries(customizedEntries) : undefined;
  const landing_page_style = buildLandingPageStyle(state);

  return {
    name: state.name || undefined,
    tags: state.tags.length ? state.tags : undefined,
    species: state.species || undefined,
    gender: state.gender || undefined,
    voice_id: state.voiceId || undefined,
    profile: state.profile || undefined,
    disposition: state.disposition || undefined,
    anonymous_tags: state.anonymousTags.length ? state.anonymousTags : undefined,
    visibility: normalizeVisibility(state.visibility),
    images: mapImagesToApi(state.images),
    opening_prologue: (() => {
      const lines = state.openingPrologue.map((line) => line.trim()).filter(Boolean);
      return lines.length ? lines : undefined;
    })(),
    customized_settings,
    landing_page_url: (state.landingPageUrl ?? '').trim() || undefined,
    landing_page_style,
  };
}

export function normalizeDraftConfigKeys(
  state: CharacterDraftFormState,
  lookups?: PageConfigLookups,
): CharacterDraftFormState {
  if (!lookups) return normalizeDraftFormState(state);
  return normalizeDraftFormState({
    ...state,
    tags: normalizeStoredTagKeys(state.tags, lookups),
    species: normalizeStoredSpeciesKey(state.species, lookups),
  });
}

/** 介绍页预览请求体 */
export function buildLandingPreviewApiForm(state: CharacterDraftFormState): CharacterCreateForm {
  return draftStateToApiForm(state);
}

/** 介绍页正式生成请求体 */
export function buildGenLandingPageRequest(
  state: CharacterDraftFormState,
  options?: { characterId?: string },
): GenLandingPageReq {
  const styleKey = state.landingPageStyleKey.trim();
  if (!styleKey) {
    throw new Error('landing page style_key is required');
  }

  const req: GenLandingPageReq = {
    style_key: styleKey as GenLandingPageReq['style_key'],
    character_create_form: draftStateToApiForm(state),
  };

  const prompt = state.landingPagePrompt.trim();
  if (prompt) req.user_prompt = prompt;

  const characterId = options?.characterId?.trim();
  if (characterId) req.character_id = characterId;

  return req;
}

export function pickCoverUrlFromFormState(state: Pick<CharacterDraftFormState, 'images'>): string | null {
  if (!state.images.length) return null;
  const main = state.images.find((img) => img.isMain) ?? state.images[0];
  return main?.url ?? null;
}

export function pickDisplayNameFromFormState(state: Pick<CharacterDraftFormState, 'name'>): string {
  return state.name.trim();
}

/** 合并服务端草稿与本地草稿，较新者胜出 */
export function mergeDraftFormState(
  server: CharacterDraftFormState,
  local: CharacterDraftFormState | null,
): CharacterDraftFormState {
  if (!local || local.draftId !== server.draftId) return server;
  if (local.localUpdatedAt > server.serverUpdatedAt) {
    return {
      ...local,
      serverUpdatedAt: server.serverUpdatedAt,
    };
  }
  return server;
}

export function mergeDraftItemWithLocal(draft: CharacterDraftItem, local: CharacterDraftFormState | null) {
  const server = draftStateFromServerItem(draft);
  return mergeDraftFormState(server, local);
}

export function emptyDraftForId(draftId: string) {
  return createEmptyDraftFormState(draftId);
}

/** 草稿是否已有可回显的内容（用于判断是否需要从已发布角色回填） */
export function isDraftFormMeaningful(form: CharacterCreateForm): boolean {
  return Boolean(
    form.name?.trim() ||
      form.images?.length ||
      form.profile?.trim() ||
      form.species?.trim() ||
      form.gender ||
      form.voice_id ||
      (form.opening_prologue?.length ?? 0) > 0 ||
      Object.keys(form.customized_settings ?? {}).length > 0,
  );
}

function resolveGenderValue(gender?: string): CharacterDraftFormState['gender'] {
  const value = gender?.trim().toLowerCase();
  if (value === 'male' || value === 'female' || value === 'other') return value;
  return '';
}

/** 已发布角色详情 → 创作表单（用于编辑回显） */
export function mapCharacterDetailToCreateForm(character: CharacterDetailInfo): CharacterCreateForm {
  const images: UserUploadImage[] = [];
  const seenUrls = new Set<string>();

  for (const outfit of character.outfits ?? []) {
    for (const appearance of outfit.appearances ?? []) {
      const url = appearance.image?.url?.trim();
      if (!url || seenUrls.has(url)) continue;
      seenUrls.add(url);
      images.push({
        name: appearance.appearance_name ?? '',
        image_type: 'upload',
        url,
        is_main_pic:
          appearance.in_use ||
          appearance.is_default ||
          appearance.appearance_id === character.current_appearance_id,
      });
    }
  }

  if (images.length > 0 && !images.some((img) => img.is_main_pic)) {
    images[0] = { ...images[0]!, is_main_pic: true };
  }

  const splashUrl = character.splash_img?.url?.trim();
  if (splashUrl && !seenUrls.has(splashUrl)) {
    images.unshift({
      name: 'splash',
      image_type: 'upload',
      url: splashUrl,
      is_main_pic: true,
    });
    for (let index = 1; index < images.length; index += 1) {
      images[index] = { ...images[index]!, is_main_pic: false };
    }
  }

  return {
    name: character.name?.trim() || character.aka?.trim() || undefined,
    gender: resolveGenderValue(character.gender) || undefined,
    species: character.species?.trim() || undefined,
    profile: character.profile?.trim() || undefined,
    voice_id: character.voice?.voice_id,
    visibility: character.is_public === false ? 'private' : 'public',
    images: images.length ? images : undefined,
    landing_page_url: character.landing_page_urls?.[0]?.trim() || undefined,
  };
}
