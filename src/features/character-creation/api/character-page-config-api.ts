import type {
  CharacterVoice,
  GeneralTagInfo,
  GetCharacterPageConfigResp,
} from '@/generated/arca_apiComponents';
import { getCharacterPageConfig } from '@/generated/arca_api';

import { USE_CHARACTER_CREATION_MOCK } from '../config';
import type { CharacterDraftFormState } from '../types/form';

import * as mock from './character-creation-api.mock';

export type GenderValue = Exclude<CharacterDraftFormState['gender'], ''>;
export type VisibilityValue = CharacterDraftFormState['visibility'];

export type PageConfigSelectOption<T extends string = string> = {
  value: T;
  emoji: string;
  label: string;
};

const SPECIES_KEYS = new Set(['human', 'elf', 'beast', 'animal', 'other', 'orc']);

const LONG_TEXT_SETTING_KEYS = new Set([
  'growth',
  'family',
  'relationship',
  'worldview',
  'appearance',
  'speech-habit',
  'values',
  'lifestyle',
  'hobby',
  'dislikes',
  'career',
  'fashion',
  'social-mode',
  'love-language',
]);

export type DetailSettingOption = {
  key: string;
  emoji: string;
  label: string;
  maxLength: number;
};

export type CharacterTagOption = {
  key: string;
  label: string;
};

/** page_config 配置项 key ↔ 展示文案 查找表（草稿存 key、UI 渲染 label） */
export type PageConfigLookups = {
  tagKeyToLabel: Map<string, string>;
  tagLabelToKey: Map<string, string>;
  speciesKeyToLabel: Map<string, string>;
  speciesLabelToKey: Map<string, string>;
};

let pageConfigPromise: Promise<GetCharacterPageConfigResp> | null = null;

/** 拉取 page_config（同一会话内复用缓存，避免重复请求） */
export async function fetchCharacterPageConfig(): Promise<GetCharacterPageConfigResp> {
  if (!pageConfigPromise) {
    pageConfigPromise = (USE_CHARACTER_CREATION_MOCK
      ? (mock.getCharacterPageConfig() as Promise<GetCharacterPageConfigResp>)
      : getCharacterPageConfig()
    ).catch((error) => {
      pageConfigPromise = null;
      throw error;
    });
  }
  return pageConfigPromise!;
}

export function resetCharacterPageConfigCache() {
  pageConfigPromise = null;
}

function mapGeneralTagOptions<T extends string>(
  items: GeneralTagInfo[] | undefined,
  resolveValue: (tagKey: string) => T | null,
): PageConfigSelectOption<T>[] {
  const seen = new Set<T>();
  return (items ?? [])
    .map((item) => {
      const value = resolveValue(item.tag_key?.trim() ?? '');
      if (!value) return null;
      const label = item.tag_name?.trim();
      if (!label) return null;
      return {
        value,
        emoji: item.tag_icon?.trim() || '•',
        label,
      };
    })
    .filter((item): item is PageConfigSelectOption<T> => {
      if (!item) return false;
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
}

function normalizeGenderValue(tagKey: string): GenderValue | null {
  const key = tagKey.trim().toLowerCase();
  if (key === 'male' || key === '男' || key === '男性') return 'male';
  if (key === 'female' || key === '女' || key === '女性') return 'female';
  if (key === 'other' || key === '其他' || key === '非人类' || key === 'unknown') return 'other';
  return null;
}

function resolveVisibilityValue(tagKey: string): VisibilityValue | null {
  const key = tagKey.trim().toLowerCase();
  if (key === 'public' || key === '公开') return 'public';
  if (key === 'private' || key === '私密') return 'private';
  return null;
}

function normalizeSpeciesValue(tagKey: string): string | null {
  const key = tagKey.trim().toLowerCase();
  if (!key) return null;
  return key === 'orc' ? 'beast' : key;
}

function resolveSpeciesValue(tagKey: string): string | null {
  const key = tagKey.trim().toLowerCase();
  if (!SPECIES_KEYS.has(key)) return null;
  return normalizeSpeciesValue(key);
}

function resolveDetailSettingKey(tagKey: string): string | null {
  const key = tagKey.trim();
  if (!key) return null;
  if (resolveVisibilityValue(key)) return null;
  if (SPECIES_KEYS.has(key.toLowerCase())) return null;
  return key;
}

export function mapPageConfigCharacterTagOptions(
  resp: Pick<GetCharacterPageConfigResp, 'character_tags'>,
): CharacterTagOption[] {
  const seen = new Set<string>();
  return (resp.character_tags ?? [])
    .map((item) => {
      const key = item.tag_key?.trim() ?? '';
      const label = item.tag_name?.trim() ?? '';
      if (!key || !label) return null;
      if (seen.has(key)) return null;
      seen.add(key);
      return { key, label };
    })
    .filter((item): item is CharacterTagOption => item !== null);
}

/** @deprecated 使用 mapPageConfigCharacterTagOptions，草稿应存 tag_key */
export function mapPageConfigTags(
  resp: Pick<GetCharacterPageConfigResp, 'character_tags'>,
): string[] {
  return mapPageConfigCharacterTagOptions(resp).map((item) => item.key);
}

export function buildPageConfigLookups(
  resp: Pick<GetCharacterPageConfigResp, 'character_tags' | 'species' | 'setting_options'>,
): PageConfigLookups {
  const tagKeyToLabel = new Map<string, string>();
  const tagLabelToKey = new Map<string, string>();
  for (const item of resp.character_tags ?? []) {
    const key = item.tag_key?.trim() ?? '';
    const label = item.tag_name?.trim() ?? '';
    if (!key || !label) continue;
    tagKeyToLabel.set(key, label);
    if (!tagLabelToKey.has(label)) tagLabelToKey.set(label, key);
  }

  const speciesKeyToLabel = new Map<string, string>();
  const speciesLabelToKey = new Map<string, string>();
  const speciesItems = resp.species?.length
    ? resp.species
    : (resp.setting_options ?? []).filter((item) =>
        SPECIES_KEYS.has((item.tag_key?.trim() ?? '').toLowerCase()),
      );
  for (const item of speciesItems) {
    const rawKey = item.tag_key?.trim() ?? '';
    const key = normalizeSpeciesValue(rawKey);
    const label = item.tag_name?.trim() ?? '';
    if (!key || !label) continue;
    speciesKeyToLabel.set(key, label);
    if (!speciesLabelToKey.has(label)) speciesLabelToKey.set(label, key);
    if (rawKey && rawKey !== key && !speciesLabelToKey.has(rawKey)) {
      speciesLabelToKey.set(rawKey, key);
    }
  }

  return { tagKeyToLabel, tagLabelToKey, speciesKeyToLabel, speciesLabelToKey };
}

/** 草稿回填：将历史 tag_name 归一为 tag_key */
export function normalizeStoredTagKeys(tags: string[], lookups: PageConfigLookups): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key =
      lookups.tagKeyToLabel.has(trimmed)
        ? trimmed
        : (lookups.tagLabelToKey.get(trimmed) ?? trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

/** 草稿回填：将历史 species 展示名归一为 tag_key */
export function normalizeStoredSpeciesKey(
  species: string,
  lookups: PageConfigLookups,
): string {
  const trimmed = species.trim();
  if (!trimmed) return '';
  if (lookups.speciesKeyToLabel.has(trimmed)) return trimmed;
  return lookups.speciesLabelToKey.get(trimmed) ?? trimmed;
}

export function resolveTagLabels(
  tagKeys: string[],
  lookups: PageConfigLookups,
): string[] {
  return tagKeys.map((key) => lookups.tagKeyToLabel.get(key) ?? key);
}

export function mapPageConfigGenderOptions(
  genders: GeneralTagInfo[] | undefined,
): PageConfigSelectOption<GenderValue>[] {
  return mapGeneralTagOptions(genders, normalizeGenderValue);
}

export function mapPageConfigSpeciesOptions(
  species: GeneralTagInfo[] | undefined,
  settingOptionsFallback?: GeneralTagInfo[] | undefined,
): PageConfigSelectOption[] {
  if (species?.length) {
    return mapGeneralTagOptions(species, normalizeSpeciesValue);
  }
  return mapGeneralTagOptions(settingOptionsFallback, resolveSpeciesValue);
}

export function mapPageConfigVisibilityOptions(
  settingOptions: GeneralTagInfo[] | undefined,
): PageConfigSelectOption<VisibilityValue>[] {
  return mapGeneralTagOptions(settingOptions, resolveVisibilityValue);
}

export function mapPageConfigDetailSettingOptions(
  settingOptions: GeneralTagInfo[] | undefined,
): DetailSettingOption[] {
  const seen = new Set<string>();
  return (settingOptions ?? [])
    .map((item) => {
      const key = resolveDetailSettingKey(item.tag_key?.trim() ?? '');
      if (!key || seen.has(key)) return null;
      const label = item.tag_name?.trim();
      if (!label) return null;
      seen.add(key);
      return {
        key,
        emoji: item.tag_icon?.trim() || '📓',
        label,
        maxLength: LONG_TEXT_SETTING_KEYS.has(key) ? 200 : 10,
      };
    })
    .filter((item): item is DetailSettingOption => item !== null);
}

export async function fetchPresetCharacterTags(): Promise<string[]> {
  try {
    const resp = await fetchCharacterPageConfig();
    return mapPageConfigCharacterTagOptions(resp).map((item) => item.key);
  } catch (error) {
    console.warn('[fetchPresetCharacterTags] page_config failed:', error);
    return [];
  }
}

export async function fetchGenderOptions(): Promise<PageConfigSelectOption<GenderValue>[]> {
  try {
    const resp = await fetchCharacterPageConfig();
    return mapPageConfigGenderOptions(resp.genders);
  } catch (error) {
    console.warn('[fetchGenderOptions] page_config failed:', error);
    return [];
  }
}

export async function fetchSpeciesOptions(): Promise<PageConfigSelectOption[]> {
  try {
    const resp = await fetchCharacterPageConfig();
    return mapPageConfigSpeciesOptions(resp.species, resp.setting_options);
  } catch (error) {
    console.warn('[fetchSpeciesOptions] page_config failed:', error);
    return [];
  }
}

export async function fetchVisibilityOptions(): Promise<
  PageConfigSelectOption<VisibilityValue>[]
> {
  try {
    const resp = await fetchCharacterPageConfig();
    return mapPageConfigVisibilityOptions(resp.setting_options);
  } catch (error) {
    console.warn('[fetchVisibilityOptions] page_config failed:', error);
    return [];
  }
}

export async function fetchPageConfigVoices(): Promise<CharacterVoice[]> {
  try {
    const resp = await fetchCharacterPageConfig();
    return resp.voices ?? [];
  } catch (error) {
    console.warn('[fetchPageConfigVoices] page_config failed:', error);
    return [];
  }
}

function resolveVoiceTagKey(tag: GeneralTagInfo | string): string {
  if (typeof tag === 'string') return tag.trim().toLowerCase();
  return tag.tag_key?.trim().toLowerCase() ?? '';
}

export function filterVoicesByGender(
  voices: CharacterVoice[],
  gender: GenderValue,
): CharacterVoice[] {
  return voices.filter((voice) => {
    const tagKeys = (voice.voice_tags ?? []).map(resolveVoiceTagKey);
    return tagKeys.some((key) => normalizeGenderValue(key) === gender);
  });
}
