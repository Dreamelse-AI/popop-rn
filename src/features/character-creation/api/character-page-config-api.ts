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

let pageConfigPromise: Promise<GetCharacterPageConfigResp> | null = null;

/** 拉取 page_config（同一会话内复用缓存，避免重复请求） */
export async function fetchCharacterPageConfig(): Promise<GetCharacterPageConfigResp> {
  if (!pageConfigPromise) {
    pageConfigPromise = (USE_CHARACTER_CREATION_MOCK
      ? mock.getCharacterPageConfig()
      : getCharacterPageConfig()
    ).catch((error) => {
      pageConfigPromise = null;
      throw error;
    });
  }
  return pageConfigPromise;
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

function resolveSpeciesValue(tagKey: string): string | null {
  const key = tagKey.trim().toLowerCase();
  if (!SPECIES_KEYS.has(key)) return null;
  return key === 'orc' ? 'beast' : key;
}

function resolveDetailSettingKey(tagKey: string): string | null {
  const key = tagKey.trim();
  if (!key) return null;
  if (resolveVisibilityValue(key)) return null;
  if (SPECIES_KEYS.has(key.toLowerCase())) return null;
  return key;
}

export function mapPageConfigTags(
  resp: Pick<GetCharacterPageConfigResp, 'character_tags'>,
): string[] {
  return (resp.character_tags ?? [])
    .map((item) => item.tag_name?.trim() ?? '')
    .filter(Boolean);
}

export function mapPageConfigGenderOptions(
  genders: GeneralTagInfo[] | undefined,
): PageConfigSelectOption<GenderValue>[] {
  return mapGeneralTagOptions(genders, normalizeGenderValue);
}

export function mapPageConfigSpeciesOptions(
  settingOptions: GeneralTagInfo[] | undefined,
): PageConfigSelectOption[] {
  return mapGeneralTagOptions(settingOptions, resolveSpeciesValue);
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
    return mapPageConfigTags(resp);
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
    return mapPageConfigSpeciesOptions(resp.setting_options);
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
