import type { PhoneMessageOutput } from '@/generated/arca_apiComponents';

import { RE_FRIEND_SYSTEM_MESSAGE } from '../config/chat-config';

const mockChatStore = new Map<string, PhoneMessageOutput[]>();
const removedFriendIds = new Set<string>();

let mockCursorCounter = 1000;
let mockMessageIdCounter = 5000;

function nextMockCursor(): string {
  return String(++mockCursorCounter);
}

function nextMockMessageId(): string {
  return `mock-msg-${++mockMessageIdCounter}`;
}

function getStoreMessages(characterId: string): PhoneMessageOutput[] {
  if (!mockChatStore.has(characterId)) {
    mockChatStore.set(characterId, []);
  }
  return mockChatStore.get(characterId) ?? [];
}

export function getMockChatHistory(characterId: string): PhoneMessageOutput[] {
  return getStoreMessages(characterId);
}

export function wasMockFriendRemoved(characterId: string): boolean {
  return removedFriendIds.has(characterId);
}

export function markMockFriendRemoved(characterId: string) {
  removedFriendIds.add(characterId);
}

export function markMockFriendRestored(characterId: string) {
  removedFriendIds.delete(characterId);
}

export function insertReFriendMessages(characterId: string): {
  systemMessage: PhoneMessageOutput;
  characterMessages: PhoneMessageOutput[];
} {
  const now = Date.now();
  const systemMessage: PhoneMessageOutput = {
    message_id: nextMockMessageId(),
    msg_type: 'text',
    msg_direction: 'system',
    text: { text: RE_FRIEND_SYSTEM_MESSAGE },
    created_at: now,
    cursor: nextMockCursor(),
  };

  const characterMessages: PhoneMessageOutput[] = [
    {
      message_id: nextMockMessageId(),
      msg_type: 'text',
      msg_direction: 'character',
      text: { text: '好久不见，我还以为你不会再找我了。\n最近过得怎么样？' },
      created_at: now + 1,
      cursor: nextMockCursor(),
    },
  ];

  const existing = getStoreMessages(characterId);
  mockChatStore.set(characterId, [...existing, systemMessage, ...characterMessages]);
  return { systemMessage, characterMessages };
}
