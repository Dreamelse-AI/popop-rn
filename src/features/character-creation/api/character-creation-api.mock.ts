import type {
  CharacterCreateForm,
  CharacterDraftItem,
  CharacterPageBasicInfo,
  DeleteCharacterDraftReq,
  DeleteCharacterDraftResp,
  DeleteCharacterReq,
  DeleteCharacterResp,
  GetCharacterDraftDetailReqParams,
  GetCharacterDraftDetailResp,
  GetCharacterDraftStatusResp,
  ListCharacterDraftsResp,
  ListUserCharactersReq,
  ListUserCharactersResp,
  Media,
  SaveCharacterDraftReq,
  SaveCharacterDraftResp,
  SubmitCharacterDraftReq,
  SubmitCharacterDraftResp,
} from '@/generated/arca_apiComponents';

import { MOCK_CREATION_LATENCY_MS } from '../config';

const MOCK_COVER =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop';

let draftSeq = 3;
let publishedSeq = 1;

type MockDraftRecord = {
  draft_id: string;
  target_character_id?: string;
  character_create_form: CharacterCreateForm;
  updated_at: number;
  status: CharacterDraftItem['status'];
  reject_reason?: string;
};

const mockDrafts: MockDraftRecord[] = [
  {
    draft_id: 'mock-draft-1',
    character_create_form: {
      name: '',
      landing_page_url: undefined,
    },
    updated_at: Date.now() - 3600 * 1000,
    status: 'draft',
  },
  {
    draft_id: 'mock-draft-2',
    character_create_form: {
      name: '大聪明',
      images: [
        {
          name: 'main',
          image_type: 'aigc',
          url: MOCK_COVER,
          is_main_pic: true,
        },
      ],
      landing_page_url: undefined,
    },
    updated_at: Date.now() - 120 * 1000,
    status: 'draft',
  },
];

function pickCoverMedia(form: CharacterCreateForm): Media | undefined {
  const image = form.images?.find(img => img.is_main_pic) ?? form.images?.[0];
  if (!image?.url) return undefined;
  return { id: 'cover', url: image.url, media_type: 'image' };
}

function toDraftListItem(draft: MockDraftRecord): CharacterDraftItem {
  const form = draft.character_create_form;
  const name = form.name?.trim();
  return {
    draft_id: draft.draft_id,
    name: name || undefined,
    media: pickCoverMedia(form),
    updated_at: draft.updated_at,
    status: draft.status,
    reject_reason: draft.reject_reason,
  };
}

const mockPublished: CharacterPageBasicInfo[] = [];

function delay() {
  return new Promise<void>(resolve => {
    setTimeout(resolve, MOCK_CREATION_LATENCY_MS);
  });
}

function nextDraftId() {
  draftSeq += 1;
  return `mock-draft-${draftSeq}`;
}

function nextPublishedId() {
  publishedSeq += 1;
  return `mock-char-${publishedSeq}`;
}


export async function listCharacterDrafts(): Promise<ListCharacterDraftsResp> {
  await delay();
  return { drafts: mockDrafts.map(toDraftListItem) };
}

export async function getCharacterDraftDetail(
  params: GetCharacterDraftDetailReqParams,
): Promise<GetCharacterDraftDetailResp> {
  await delay();
  const draft = mockDrafts.find(d => d.draft_id === params.draft_id);
  if (!draft) throw new Error('Draft not found');
  return {
    draft: {
      draft_id: draft.draft_id,
      target_character_id: draft.target_character_id,
      character_create_form: draft.character_create_form ?? {},
      updated_at: draft.updated_at,
      status: draft.status,
      reject_reason: draft.reject_reason,
    },
  };
}

export async function getCharacterDraftStatus(
  params: GetCharacterDraftDetailReqParams,
): Promise<GetCharacterDraftStatusResp> {
  await delay();
  const draft = mockDrafts.find(d => d.draft_id === params.draft_id);
  if (!draft) throw new Error('Draft not found');
  return { status: draft.status };
}

export async function listUserCharacters(
  _req: ListUserCharactersReq,
): Promise<ListUserCharactersResp> {
  await delay();
  return {
    characters: [...mockPublished],
    max_characters: 10,
    next_cursor: '',
    has_more: false,
  };
}

export async function saveCharacterDraft(
  req: SaveCharacterDraftReq,
): Promise<SaveCharacterDraftResp> {
  await delay();
  const now = Date.now();
  const existing = req.draft_id
    ? mockDrafts.find(d => d.draft_id === req.draft_id)
    : undefined;

  if (existing) {
    existing.character_create_form = req.character_create_form;
    existing.updated_at = now;
    if (req.target_character_id) {
      existing.target_character_id = req.target_character_id;
    }
    return { draft_id: existing.draft_id, updated_at: now };
  }

  let form = req.character_create_form;
  if (req.target_character_id) {
    const published = mockPublished.find(
      item => item.basic_info.character_id === req.target_character_id,
    );
    if (published) {
      const cover = published.basic_info.image;
      form = {
        ...form,
        name: form.name ?? published.basic_info.name ?? '',
        images: form.images?.length
          ? form.images
          : cover
            ? [{ name: 'main', image_type: 'aigc' as const, url: cover.url, is_main_pic: true }]
            : undefined,
        landing_page_url: form.landing_page_url,
      };
    }
  }

  const draftId = nextDraftId();
  mockDrafts.unshift({
    draft_id: draftId,
    target_character_id: req.target_character_id,
    character_create_form: form,
    updated_at: now,
    status: 'draft',
  });
  return { draft_id: draftId, updated_at: now };
}

export async function deleteCharacterDraft(
  req: DeleteCharacterDraftReq,
): Promise<DeleteCharacterDraftResp> {
  await delay();
  const index = mockDrafts.findIndex(d => d.draft_id === req.draft_id);
  if (index >= 0) mockDrafts.splice(index, 1);
  return {};
}

/** Mock 异步发布：轮询 ready 时把草稿移入已发布列表 */
export function mockDraftExists(draftId: string): boolean {
  return mockDrafts.some(draft => draft.draft_id === draftId);
}

export function finalizeMockSubmitDraft(draftId: string): string {
  const index = mockDrafts.findIndex(d => d.draft_id === draftId);
  if (index < 0) throw new Error('Draft not found');

  const [draft] = mockDrafts.splice(index, 1);
  if (!draft) throw new Error('Draft not found');

  const characterId = nextPublishedId();
  const cover = draft.character_create_form.images?.[0];
  mockPublished.unshift({
    basic_info: {
      character_id: characterId,
      name: draft.character_create_form.name ?? '',
      image: cover ? { id: 'main', url: cover.url, media_type: 'image' } : undefined,
      like_count: 0,
    },
    character_status: { character_state: 'idle' },
    unread_count: 0,
  });
  return characterId;
}

export async function submitCharacterDraft(
  req: SubmitCharacterDraftReq,
): Promise<SubmitCharacterDraftResp> {
  await delay();
  const characterId = finalizeMockSubmitDraft(req.draft_id);
  return { character_id: characterId, draft_id: req.draft_id, draft_status: 'draft' };
}

export async function deleteCharacter(req: DeleteCharacterReq): Promise<DeleteCharacterResp> {
  await delay();
  const index = mockPublished.findIndex(c => c.basic_info.character_id === req.character_id);
  if (index >= 0) mockPublished.splice(index, 1);
  return {};
}

/** Mock：从已发布角色列表构造创作表单快照 */
export async function getPublishedCharacterCreateForm(
  characterId: string,
): Promise<CharacterCreateForm> {
  await delay();
  const published = mockPublished.find(item => item.basic_info.character_id === characterId);
  if (!published) return {};

  const cover = published.basic_info.image;
  return {
    name: published.basic_info.name ?? '',
    images: cover
      ? [{ name: 'main', image_type: 'aigc' as const, url: cover.url, is_main_pic: true }]
      : undefined,
  };
}

const MOCK_PRESET_TAGS = [
  '心机',
  '坏男人',
  '专情',
  '年下',
  '身份差距',
  '霸道',
  '温柔',
  '病娇',
];

const MOCK_STYLE_COVER =
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop';

const MOCK_PAGE_CONFIG_STYLES = [
  {
    style_key: 'general',
    style_name: '通用',
    style_icon: {
      id: 'mock-style-general',
      url: MOCK_STYLE_COVER,
      media_type: 'image',
    },
  },
  {
    style_key: '25d',
    style_name: '2.5次元',
    style_icon: {
      id: 'mock-style-25d',
      url: 'https://images.unsplash.com/photo-1613376023733-0a7331a38194?w=200&h=200&fit=crop',
      media_type: 'image',
    },
  },
  {
    style_key: 'real',
    style_name: '真人',
    style_icon: {
      id: 'mock-style-real',
      url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
      media_type: 'image',
    },
  },
  {
    style_key: 'anime',
    style_name: '二次元',
    style_icon: {
      id: 'mock-style-anime',
      url: 'https://images.unsplash.com/photo-1612036781132-97479b2d2a2a?w=200&h=200&fit=crop',
      media_type: 'image',
    },
  },
  {
    style_key: 'chibi',
    style_name: 'Q版',
    style_icon: {
      id: 'mock-style-chibi',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
      media_type: 'image',
    },
  },
  {
    style_key: 'pixel',
    style_name: '像素',
    style_icon: {
      id: 'mock-style-pixel',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop',
      media_type: 'image',
    },
  },
];

export async function getCharacterPageConfig() {
  await delay();
  return {
    genders: [
      { tag_key: 'female', tag_icon: '👩', tag_name: '女性' },
      { tag_key: 'male', tag_icon: '👦', tag_name: '男性' },
      { tag_key: 'other', tag_icon: '👾', tag_name: '非人类' },
    ],
    character_tags: MOCK_PRESET_TAGS.map((name, index) => ({
      tag_key: String(index + 1),
      tag_icon: '',
      tag_name: name,
    })),
    species: [
      { tag_key: 'human', tag_icon: '☺️', tag_name: '人类' },
      { tag_key: 'elf', tag_icon: '🧚', tag_name: '精灵' },
      { tag_key: 'beast', tag_icon: '🐱', tag_name: '兽人' },
      { tag_key: 'animal', tag_icon: '🐶', tag_name: '动物' },
      { tag_key: 'other', tag_icon: '👾', tag_name: '其他' },
    ],
    setting_options: [
      { tag_key: 'private', tag_icon: '🔒', tag_name: '私密' },
      { tag_key: 'public', tag_icon: '👀', tag_name: '公开' },
      { tag_key: 'birthplace', tag_icon: '👶🏻', tag_name: '出生地' },
      { tag_key: 'residence', tag_icon: '📍', tag_name: '居住地' },
      { tag_key: 'career', tag_icon: '💼', tag_name: '职业' },
      { tag_key: 'appearance', tag_icon: '🌈', tag_name: '外貌' },
      { tag_key: 'speech-habit', tag_icon: '💬', tag_name: '语言习惯' },
      { tag_key: 'fashion', tag_icon: '🧥', tag_name: '穿衣风格' },
      { tag_key: 'social-mode', tag_icon: '🍻', tag_name: '社交模式' },
      { tag_key: 'love-language', tag_icon: '💞', tag_name: '表达爱的方式' },
      { tag_key: 'values', tag_icon: '💎', tag_name: '价值观' },
      { tag_key: 'lifestyle', tag_icon: '🛏', tag_name: '生活习惯' },
      { tag_key: 'hobby', tag_icon: '🍭', tag_name: '爱好' },
      { tag_key: 'dislikes', tag_icon: '💣', tag_name: '讨厌的东西' },
      { tag_key: 'growth', tag_icon: '⛳️', tag_name: '成长经历' },
      { tag_key: 'family', tag_icon: '👩‍👩‍👧‍👦', tag_name: '家庭成员' },
      { tag_key: 'relationship', tag_icon: '👭', tag_name: '社交关系' },
      { tag_key: 'worldview', tag_icon: '🧿', tag_name: '特殊背景/世界观' },
      { tag_key: 'wishlist', tag_icon: '💝', tag_name: '愿望清单' },
    ],
    voices: [
      {
        voice_id: 'mock-voice-male-1',
        voice_name: '그는 언제나',
        voice_tags: [{ tag_key: 'male', tag_icon: '', tag_name: '男性' }],
        sample: { id: 's1', url: '', media_type: 'audio' },
      },
      {
        voice_id: 'mock-voice-male-2',
        voice_name: '정말 피곤하시겠어요',
        voice_tags: [{ tag_key: 'male', tag_icon: '', tag_name: '男性' }],
        sample: { id: 's2', url: '', media_type: 'audio' },
      },
      {
        voice_id: 'mock-voice-female-1',
        voice_name: '친구 추가',
        voice_tags: [{ tag_key: 'female', tag_icon: '', tag_name: '女性' }],
        sample: { id: 's3', url: '', media_type: 'audio' },
      },
      {
        voice_id: 'mock-voice-other-1',
        voice_name: 'ENFP',
        voice_tags: [{ tag_key: 'other', tag_icon: '', tag_name: '其他' }],
        sample: { id: 's4', url: '', media_type: 'audio' },
      },
    ],
    appearance_styles: MOCK_PAGE_CONFIG_STYLES,
    landing_page_styles: [],
  };
}
