import type { EmojiItem } from '@/generated/arca_apiComponents';
import type { ListEmojiPanelResp } from '@/generated/arca_apiComponents';

const PLACEHOLDER_AVATAR_1 = 'https://placeholder.test/avatar1.png'
const PLACEHOLDER_AVATAR_2 = 'https://placeholder.test/avatar2.png'
const PLACEHOLDER_AVATAR_3 = 'https://placeholder.test/avatar3.png'
const PLACEHOLDER_AVATAR_4 = 'https://placeholder.test/avatar4.png'

export type MockEmojiItem = EmojiItem & {
  description: string;
  language: 'zh' | 'ko' | 'en';
  scene?: string;
  emotion?: string;
  persona?: string;
  gender?: string;
};

export const MOCK_EMOJI_LIBRARY: MockEmojiItem[] = [
  {
    emoji_id: 'e1',
    media: { id: 'e1', url: PLACEHOLDER_AVATAR_1, media_type: 'image' },
    description: '开心',
    language: 'zh',
    scene: '日常',
    emotion: '开心',
  },
  {
    emoji_id: 'e2',
    media: { id: 'e2', url: PLACEHOLDER_AVATAR_2, media_type: 'image' },
    description: '委屈',
    language: 'zh',
    scene: '日常',
    emotion: '委屈',
  },
  {
    emoji_id: 'e3',
    media: { id: 'e3', url: PLACEHOLDER_AVATAR_3, media_type: 'image' },
    description: '生气',
    language: 'zh',
    scene: '日常',
    emotion: '生气',
  },
  {
    emoji_id: 'e4',
    media: { id: 'e4', url: PLACEHOLDER_AVATAR_4, media_type: 'image' },
    description: '惊讶',
    language: 'zh',
    scene: '日常',
    emotion: '惊讶',
  },
  {
    emoji_id: 'e5',
    media: { id: 'e5', url: PLACEHOLDER_AVATAR_1, media_type: 'image' },
    description: '기쁨',
    language: 'ko',
    scene: '일상',
    emotion: '기쁨',
  },
  {
    emoji_id: 'e6',
    media: { id: 'e6', url: PLACEHOLDER_AVATAR_2, media_type: 'image' },
    description: 'happy',
    language: 'en',
    scene: 'daily',
    emotion: 'happy',
  },
];

export function getEmojiDescriptionMap(language: 'zh' | 'ko' | 'en' = 'zh'): Map<string, string> {
  return new Map(
    MOCK_EMOJI_LIBRARY.filter(item => item.language === language).map(item => [
      item.emoji_id,
      item.description,
    ]),
  );
}

export function listMockEmojis(language: 'zh' | 'ko' | 'en' = 'zh'): MockEmojiItem[] {
  return MOCK_EMOJI_LIBRARY.filter(item => item.language === language);
}

const mockRecentEmojiIds: string[] = [];

export function listMockEmojiPanel(language: 'zh' | 'ko' | 'en' = 'zh'): ListEmojiPanelResp {
  const emojis = listMockEmojis(language);
  const recent = mockRecentEmojiIds
    .map(id => emojis.find(item => item.emoji_id === id))
    .filter((item): item is MockEmojiItem => Boolean(item));

  return {
    recent,
    my_emojis: [],
    packs: [
      {
        pack_id: 'pack-daily',
        name: '日常',
        cover: { id: 'cover-daily', url: PLACEHOLDER_AVATAR_1, media_type: 'image' },
        emojis: emojis.slice(0, 4).map(item => ({
          ...item,
          source: 'platform',
          pack_id: 'pack-daily',
          name: item.description,
        })),
      },
      {
        pack_id: 'pack-fun',
        name: '趣味',
        cover: { id: 'cover-fun', url: PLACEHOLDER_AVATAR_2, media_type: 'image' },
        emojis: emojis.map(item => ({
          ...item,
          source: 'platform',
          pack_id: 'pack-fun',
          name: item.description,
        })),
      },
    ],
  };
}

export function markMockEmojiUsed(input: { emoji_id: string }): void {
  const index = mockRecentEmojiIds.indexOf(input.emoji_id);
  if (index >= 0) mockRecentEmojiIds.splice(index, 1);
  mockRecentEmojiIds.unshift(input.emoji_id);
  if (mockRecentEmojiIds.length > 24) mockRecentEmojiIds.length = 24;
}
