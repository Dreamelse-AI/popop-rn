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
  landingPageUrls: string[];
  /** 本地最后编辑时间（ms） */
  localUpdatedAt: number;
  /** 服务端 updated_at（毫秒） */
  serverUpdatedAt: number;
};

export function createEmptyDraftFormState(draftId: string, serverUpdatedAt = 0): CharacterDraftFormState {
  return {
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
    landingPageUrls: [],
    localUpdatedAt: Date.now(),
    serverUpdatedAt,
  };
}
