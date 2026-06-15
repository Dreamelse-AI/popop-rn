import type { PhoneMessageOutput } from '@/generated/arca_apiComponents';

const PLACEHOLDER_EMOJI_URL = 'https://placeholder.test/emoji1.png'

import { FOLLOW_UP_PROMPT, MOCK_CHARACTER_VOICE_URL, RE_FRIEND_GREETING_PROMPT } from '../config/chat-config';

/** 各角色静态历史（由 mock-data.ts 迁移为 PhoneMessageOutput） */
export const STATIC_CHAT_HISTORY: Record<string, PhoneMessageOutput[]> = {
  c1: [
    {
      message_id: 'hist-s1',
      msg_type: 'text',
      msg_direction: 'system',
      text: { text: '선싱후이는 2호선 C번 출구에서 머뭇거리고 있다.' },
      created_at: Date.now() - 86_400_000 * 2,
      cursor: '1',
    },
    {
      message_id: 'hist-v1',
      msg_type: 'voice',
      msg_direction: 'character',
        voice: {
          voice: {
            id: 'v1',
            url: MOCK_CHARACTER_VOICE_URL,
            media_type: 'audio',
            duration: 1000,
          },
          text: '你来了啊。',
        },
      created_at: Date.now() - 86_400_000 - 3_600_000,
      cursor: '2',
    },
    {
      message_id: 'hist-v2',
      msg_type: 'voice',
      msg_direction: 'character',
        voice: {
          voice: {
            id: 'v2',
            url: MOCK_CHARACTER_VOICE_URL,
            media_type: 'audio',
            duration: 60_000,
          },
          text: '今天有点累，但见到你就好多了。',
        },
      is_read: false,
      is_click: false,
      created_at: Date.now() - 86_400_000 - 3_500_000,
      cursor: '3',
    },
    {
      message_id: 'hist-u1',
      msg_type: 'text',
      msg_direction: 'user',
      text: { text: '알았어, 알았어' },
      created_at: Date.now() - 86_400_000 - 3_000_000,
      cursor: '4',
    },
    {
      message_id: 'hist-v3',
      msg_type: 'voice',
      msg_direction: 'user',
      voice: {
        voice: { id: 'v3', url: '', media_type: 'audio', duration: 8000 },
        text: '알았어, 알았어',
      },
      is_failed: true,
      created_at: Date.now() - 86_400_000 - 2_500_000,
      cursor: '5',
    },
    {
      message_id: 'hist-u2',
      msg_type: 'text',
      msg_direction: 'user',
      text: {
        text: '비록 우리가 일찍 철수했지만, 이번에는 당신의 또 다른 면모를 발견하게 될 줄은 전혀 예상하지 못했습니다.',
      },
      created_at: Date.now() - 86_400_000 - 2_000_000,
      cursor: '6',
    },
    {
      message_id: 'hist-c1',
      msg_type: 'text',
      msg_direction: 'character',
      text: { text: '정말 피곤하시겠어요.' },
      created_at: Date.now() - 86_400_000 - 1_800_000,
      cursor: '7',
    },
  ],
  c2: [
    {
      message_id: 'hist-c2-1',
      msg_type: 'text',
      msg_direction: 'character',
      text: { text: '[그림]' },
      created_at: Date.now() - 86_400_000,
      cursor: '1',
    },
  ],
  c3: [
    {
      message_id: 'hist-c3-1',
      msg_type: 'voice',
      msg_direction: 'character',
      voice: {
        voice: {
          id: 'v-c3',
          url: MOCK_CHARACTER_VOICE_URL,
          media_type: 'audio',
          duration: 20_000,
        },
        text: '最近怎么样？',
      },
      is_read: false,
      is_click: false,
      created_at: Date.now() - 86_400_000,
      cursor: '1',
    },
  ],
  c4: [
    {
      message_id: 'hist-c4-1',
      msg_type: 'text',
      msg_direction: 'character',
      text: {
        text: '그는 언제나 정시에 발코니에 나타나, 온 힘을 다해 풍속과 햇빛을 꼼꼼하게 측정했다...',
      },
      created_at: Date.now() - 86_400_000,
      cursor: '1',
    },
  ],
};

let messageIdCounter = 1000;
let cursorCounter = 100;

export function nextMockMessageId() {
  messageIdCounter += 1;
  return `mock-msg-${messageIdCounter}`;
}

export function nextMockCursor() {
  cursorCounter += 1;
  return String(cursorCounter);
}

/** Mock 角色回复模板 */
export function pickCharacterReply(
  userTexts: string[],
  hasEmoji: boolean,
  hasImage = false,
): PhoneMessageOutput[] {
  const joined = userTexts.join(' ');

  if (userTexts.some(text => text === FOLLOW_UP_PROMPT)) {
    return [
      {
        message_id: nextMockMessageId(),
        msg_type: 'text',
        msg_direction: 'character',
        text: { text: '你还在吗？\n刚才说的，你听到了吗？' },
        created_at: Date.now(),
        cursor: nextMockCursor(),
      },
    ];
  }

  if (userTexts.some(text => text === RE_FRIEND_GREETING_PROMPT)) {
    return [
      {
        message_id: nextMockMessageId(),
        msg_type: 'text',
        msg_direction: 'character',
        text: { text: '你回来了啊。\n我还以为我们不会再聊了呢。' },
        created_at: Date.now(),
        cursor: nextMockCursor(),
      },
    ];
  }

  if (hasImage) {
    return [
      {
        message_id: nextMockMessageId(),
        msg_type: 'text',
        msg_direction: 'character',
        text: { text: '收到你发的图片了！\n拍得不错呢～' },
        created_at: Date.now(),
        cursor: nextMockCursor(),
      },
    ];
  }

  if (hasEmoji) {
    return [
      {
        message_id: nextMockMessageId(),
        msg_type: 'text',
        msg_direction: 'character',
        text: { text: '收到你的表情了！\n我也来一个～' },
        created_at: Date.now(),
        cursor: nextMockCursor(),
      },
      {
        message_id: nextMockMessageId(),
        msg_type: 'emoji',
        msg_direction: 'character',
        emoji: {
          emoji_id: 'e1',
          media: { id: 'e1', url: PLACEHOLDER_EMOJI_URL, media_type: 'image', desc: '开心' },
        },
        created_at: Date.now() + 1,
        cursor: nextMockCursor(),
      },
    ];
  }

  if (userTexts.length >= 3) {
    return [
      {
        message_id: nextMockMessageId(),
        msg_type: 'text',
        msg_direction: 'character',
        text: { text: '你一口气发了好多条呢。\n让我慢慢想想怎么回你。' },
        created_at: Date.now(),
        cursor: nextMockCursor(),
      },
    ];
  }

  if (joined.includes('?') || joined.includes('？')) {
    return [
      {
        message_id: nextMockMessageId(),
        msg_type: 'text',
        msg_direction: 'character',
        text: { text: '这是个好问题。\n让我想想……\n嗯，我觉得可以。' },
        created_at: Date.now(),
        cursor: nextMockCursor(),
      },
    ];
  }

  return [
    {
      message_id: nextMockMessageId(),
      msg_type: 'text',
      msg_direction: 'character',
      text: { text: `嗯，我明白了。\n${joined ? `关于「${joined.slice(0, 20)}${joined.length > 20 ? '…' : ''}」` : '继续说吧'}，我在听。` },
      created_at: Date.now(),
      cursor: nextMockCursor(),
    },
  ];
}

export const MOCK_CHARACTER_STATUS = {
  character_state: '=.=백일몽',
  character_loc: '도심 한복판에 위치한 집',
};
