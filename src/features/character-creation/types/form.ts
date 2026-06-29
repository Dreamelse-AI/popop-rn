export type CreationFormSection = 'basic' | 'appearance' | 'details' | 'opening' | 'beautify';

export const CREATION_FORM_SECTIONS: CreationFormSection[] = [
  'basic',
  'appearance',
  'opening',
  'details',
  'beautify',
];

export type CreationFormImage = {
  id: string;
  url: string;
  source: 'aigc' | 'upload';
  isMain: boolean;
  tags: string[];
  storageObject?: import('@/generated/arca_apiComponents').StorageObject;
};

export type CharacterDraftFormState = {
  draftId: string;
  targetCharacterId?: string;
  name: string;
  tags: string[];
  species: string;
  gender: '' | 'male' | 'female' | 'other';
  voiceId: string;
  voiceName: string;
  profile: string;
  disposition: string;
  anonymousTags: string[];
  visibility: 'public' | 'private';
  images: CreationFormImage[];
  openingPrologue: string[];
  customizedSettings: Record<string, string>;
  landingPageUrl: string;
  /** 介绍页美化：效果补充文案（生成接口 user_prompt） */
  landingPagePrompt: string;
  /** 介绍页美化：选中的落地页画风 style_key */
  landingPageStyleKey: string;
  /** 本地最后编辑时间（ms） */
  localUpdatedAt: number;
  /** 服务端 updated_at（毫秒） */
  serverUpdatedAt: number;
};

export const DEFAULT_CHARACTER_VISIBILITY: CharacterDraftFormState['visibility'] = 'private';

export function normalizeVisibility(value: unknown): CharacterDraftFormState['visibility'] {
  if (value === 'public' || value === 'private') return value;
  return DEFAULT_CHARACTER_VISIBILITY;
}

export function normalizeDraftFormState(state: CharacterDraftFormState): CharacterDraftFormState {
  return {
    ...state,
    voiceName: '',
    visibility: normalizeVisibility(state.visibility),
    landingPageUrl: state.landingPageUrl ?? '',
    landingPagePrompt: state.landingPagePrompt ?? '',
    landingPageStyleKey: state.landingPageStyleKey ?? '',
  };
}

export function createEmptyDraftFormState(draftId: string, serverUpdatedAt = 0): CharacterDraftFormState {
  return normalizeDraftFormState({
    draftId,
    name: '',
    tags: [],
    species: '',
    gender: '',
    voiceId: '',
    voiceName: '',
    profile: '',
    disposition: '',
    anonymousTags: [],
    visibility: 'private',
    images: [],
    openingPrologue: [],
    customizedSettings: {},
    landingPageUrl: '',
    landingPagePrompt: '',
    landingPageStyleKey: '',
    localUpdatedAt: Date.now(),
    serverUpdatedAt,
  });
}
