import type {
  CharacterCreateForm,
  CharacterDetailInfo,
  CharacterDraftItem,
  CustomizedSettingInfo,
  UserUploadImage,
} from '@/generated/arca_apiComponents';

import type { CharacterDraftFormState, CreationFormImage } from '../types/form';
import { createEmptyDraftFormState } from '../types/form';
import { normalizeAppearanceImageTags } from './appearance-image-tags';

/** 服务端草稿详情（RN CharacterDraftItem 已包含完整字段） */
export type CharacterDraftDetail = CharacterDraftItem;

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

function readCustomizedSettings(
  settings: { [key: string]: CustomizedSettingInfo } | undefined,
): Record<string, string> {
  if (!settings) return {};
  return Object.fromEntries(
    Object.entries(settings)
      .map(([key, info]) => [key, info.content?.trim() ?? ''] as const)
      .filter(([, content]) => content.length > 0),
  );
}

function writeCustomizedSettings(
  settings: Record<string, string>,
): { [key: string]: CustomizedSettingInfo } | undefined {
  const entries = Object.entries(settings)
    .map(([key, content]) => [key, content.trim()] as const)
    .filter(([, content]) => content.length > 0);
  if (entries.length === 0) return undefined;
  return Object.fromEntries(
    entries.map(([key, content]) => [key, { icon: '', content }]),
  );
}

export function apiFormToDraftState(
  draftId: string,
  form: CharacterCreateForm,
  serverUpdatedAt: number,
): CharacterDraftFormState {
  const customizedSettings = readCustomizedSettings(form.customized_settings);

  return {
    draftId,
    name: form.name?.trim() ?? '',
    tags: form.tags ?? [],
    species: form.species ?? '',
    gender: form.gender ?? '',
    voiceId: form.voice?.voice_id ?? '',
    voiceName: form.voice?.voice_name ?? '',
    profile: form.profile ?? '',
    disposition: form.disposition ?? '',
    anonymousTags: form.anonymous_tags ?? [],
    visibility: form.visibility === 'public' ? 'public' : 'private',
    images: mapImagesFromApi(form.images),
    openingPrologue: form.opening_prologue ?? [],
    customizedSettings,
    landingPageUrls: form.landing_page_urls ?? [],
    localUpdatedAt: serverUpdatedAt * 1000,
    serverUpdatedAt,
  };
}

export function draftStateFromServerItem(draft: CharacterDraftItem): CharacterDraftFormState {
  const form = draft.character_create_form;
  const coverImage = form?.images?.find(img => img.is_main_pic) ?? form?.images?.[0];
  const coverUrl = coverImage?.url?.trim();
  const images: CharacterDraftFormState['images'] = coverUrl
    ? [{ id: 'cover', url: coverUrl, source: 'upload', isMain: true, tags: [] }]
    : [];

  return {
    ...createEmptyDraftFormState(draft.draft_id, draft.updated_at ?? 0),
    name: form?.name?.trim() ?? '',
    images,
  };
}

export function draftStateFromDraftDetail(detail: CharacterDraftDetail): CharacterDraftFormState {
  return {
    ...apiFormToDraftState(
      detail.draft_id,
      detail.character_create_form ?? {},
      detail.updated_at ?? 0,
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

export function draftStateToApiForm(state: CharacterDraftFormState): CharacterCreateForm {
  const customized_settings = writeCustomizedSettings(state.customizedSettings);

  return {
    name: state.name || undefined,
    tags: state.tags.length ? state.tags : undefined,
    species: state.species || undefined,
    gender: state.gender || undefined,
    voice: state.voiceId ? { voice_id: state.voiceId, voice_name: state.voiceName || undefined } : undefined,
    profile: state.profile || undefined,
    disposition: state.disposition || undefined,
    anonymous_tags: state.anonymousTags.length ? state.anonymousTags : undefined,
    visibility: state.visibility,
    images: mapImagesToApi(state.images),
    opening_prologue: (() => {
      const lines = state.openingPrologue.map((line) => line.trim()).filter(Boolean);
      return lines.length ? lines : undefined;
    })(),
    customized_settings,
    landing_page_urls: state.landingPageUrls,
  };
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
  if (local.localUpdatedAt > server.serverUpdatedAt * 1000) {
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
      form.voice?.voice_id ||
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

  const landingPageUrl = character.landing_page_url?.trim();

  return {
    name: character.name?.trim() || character.aka?.trim() || undefined,
    gender: resolveGenderValue(character.gender) || undefined,
    species: character.species?.trim() || undefined,
    profile: character.profile?.trim() || undefined,
    voice: character.voice,
    visibility: character.is_public === false ? 'private' : 'public',
    images: images.length ? images : undefined,
    landing_page_urls: landingPageUrl ? [landingPageUrl] : [],
  };
}
