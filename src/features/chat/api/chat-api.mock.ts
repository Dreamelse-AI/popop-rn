import type {
  ChatWithCharacterReq,
  ChatWithCharacterResp,
  ListCharacterPhoneChatHistoryReq,
  ListCharacterPhoneChatHistoryResp,
  ListEmojiPanelResp,
  MarkEmojiUsedReq,
  MarkEmojiUsedResp,
  MemoryRollbackReq,
  MemoryRollbackResp,
  PhoneMessageInput,
  PhoneMessageOutput,
  UpdateMessageClickStatusReq,
  UpdateMessageClickStatusResp,
} from '@/generated/arca_apiComponents';

import {
  MOCK_CHAT_LATENCY_MS,
  RE_FRIEND_SYSTEM_MESSAGE,
} from '../config/chat-config';
import {
  getEmojiDescriptionMap,
  listMockEmojiPanel,
  markMockEmojiUsed,
} from '../mock/emoji-library.mock';
import {
  MOCK_CHARACTER_STATUS,
  nextMockCursor,
  nextMockMessageId,
  pickCharacterReply,
  STATIC_CHAT_HISTORY,
} from '../mock/chat-responses.mock';

const mockChatStore = new Map<string, PhoneMessageOutput[]>();
const removedFriendIds = new Set<string>();

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

function getStoreMessages(characterId: string): PhoneMessageOutput[] {
  if (!mockChatStore.has(characterId)) {
    const staticHistory = STATIC_CHAT_HISTORY[characterId] ?? [];
    mockChatStore.set(characterId, [...staticHistory]);
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

  persistMessages(characterId, [systemMessage, ...characterMessages]);
  return { systemMessage, characterMessages };
}

function persistMessages(characterId: string, messages: PhoneMessageOutput[]) {
  const existing = getStoreMessages(characterId);
  mockChatStore.set(characterId, [...existing, ...messages]);
}

function toUserOutput(input: PhoneMessageInput, index: number): PhoneMessageOutput {
  const now = Date.now() + index;
  return {
    message_id: nextMockMessageId(),
    msg_type: input.msg_type,
    msg_direction: 'user',
    text: input.text,
    emoji: input.emoji,
    voice: input.voice,
    image: input.image,
    created_at: now,
    cursor: nextMockCursor(),
  };
}

function extractUserTexts(messages: PhoneMessageInput[]): string[] {
  const emojiMap = getEmojiDescriptionMap('zh');
  return messages.map(msg => {
    if (msg.msg_type === 'text') return msg.text?.text ?? '';
    if (msg.msg_type === 'emoji') {
      const desc = emojiMap.get(msg.emoji?.emoji_id ?? '') ?? '表情包';
      return `用户发送了一个表情包，内容是${desc}`;
    }
    if (msg.msg_type === 'voice') {
      return msg.voice?.text ?? '用户发送了一条语音';
    }
    if (msg.msg_type === 'image') {
      return '用户发送了一张图片';
    }
    return '';
  });
}

export async function chatWithCharacter(req: ChatWithCharacterReq): Promise<ChatWithCharacterResp> {
  await delay(MOCK_CHAT_LATENCY_MS);

  const currentMessages = req.messages.map((msg, index) => toUserOutput(msg, index));
  persistMessages(req.character_id, currentMessages);

  const userTexts = extractUserTexts(req.messages);
  const hasEmoji = req.messages.some(m => m.msg_type === 'emoji');
  const hasImage = req.messages.some(m => m.msg_type === 'image');
  const characterMessages = pickCharacterReply(userTexts, hasEmoji, hasImage);
  persistMessages(req.character_id, characterMessages);

  return {
    current_messages: currentMessages,
    character_messages: characterMessages,
    character_status: MOCK_CHARACTER_STATUS,
  };
}

function messageCursor(msg: PhoneMessageOutput): number {
  return Number(msg.cursor ?? '0');
}

function getSortedMessages(characterId: string): PhoneMessageOutput[] {
  return [...getStoreMessages(characterId)].sort(
    (a, b) => messageCursor(a) - messageCursor(b),
  );
}

function buildHistoryPage(
  all: PhoneMessageOutput[],
  req: ListCharacterPhoneChatHistoryReq,
): ListCharacterPhoneChatHistoryResp {
  const limit = Math.min(req.limit ?? 10, 100);

  if (all.length === 0) {
    return {
      msgs: [],
      min_cursor: '0',
      max_cursor: '0',
      up_has_more: false,
      down_has_more: false,
    };
  }

  if (!req.cursor) {
    const slice = all.slice(-limit);
    return {
      msgs: slice,
      min_cursor: slice[0]?.cursor ?? '0',
      max_cursor: slice[slice.length - 1]?.cursor ?? '0',
      up_has_more: all.length > slice.length,
      down_has_more: false,
    };
  }

  const cursorNum = Number(req.cursor);
  const direction = req.direction ?? 'up';

  if (direction === 'up') {
    const older = all.filter(msg => messageCursor(msg) < cursorNum);
    const slice = older.slice(-limit);
    return {
      msgs: slice,
      min_cursor: slice[0]?.cursor ?? req.cursor,
      max_cursor: slice[slice.length - 1]?.cursor ?? req.cursor,
      up_has_more: older.length > slice.length,
      down_has_more: false,
    };
  }

  const newer = all.filter(msg => messageCursor(msg) > cursorNum);
  const slice = newer.slice(0, limit);
  return {
    msgs: slice,
    min_cursor: slice[0]?.cursor ?? req.cursor,
    max_cursor: slice[slice.length - 1]?.cursor ?? req.cursor,
    up_has_more: false,
    down_has_more: newer.length > slice.length,
  };
}

export async function listCharacterPhoneChatHistory(
  req: ListCharacterPhoneChatHistoryReq,
): Promise<ListCharacterPhoneChatHistoryResp> {
  await delay(MOCK_CHAT_LATENCY_MS / 2);

  const all = getSortedMessages(req.character_id);
  return buildHistoryPage(all, req);
}

export async function listEmojiPanel(): Promise<ListEmojiPanelResp> {
  await delay(200);
  return listMockEmojiPanel('zh');
}

export async function markEmojiUsed(req: MarkEmojiUsedReq): Promise<MarkEmojiUsedResp> {
  await delay(80);
  markMockEmojiUsed(req);
  return {};
}

export async function memoryRollback(_req: MemoryRollbackReq): Promise<MemoryRollbackResp> {
  await delay(200);
  const msgs = mockChatStore.get(_req.character_id);
  if (!msgs) return {};

  const index = msgs.findIndex(m => m.message_id === _req.msg_id);
  if (index >= 0) {
    mockChatStore.set(_req.character_id, msgs.slice(0, index));
  }
  return {};
}

const CLICKABLE_MSG_TYPES = new Set(['voice', 'gift', 'invitation']);

export async function updateMessageClickStatus(
  req: UpdateMessageClickStatusReq,
): Promise<UpdateMessageClickStatusResp> {
  await delay(100);

  const msgs = getStoreMessages(req.character_id);
  const anchor = msgs.find(m => m.message_id === req.msg_id);
  if (!anchor) return {};

  const anchorCursor = messageCursor(anchor);
  const isClick = req.is_click !== false;

  const updated = msgs.map(msg => {
    if (messageCursor(msg) > anchorCursor) return msg;
    if (!CLICKABLE_MSG_TYPES.has(msg.msg_type)) return msg;
    return { ...msg, is_click: isClick };
  });

  mockChatStore.set(req.character_id, updated);
  return {};
}

export function resetMockChatStore() {
  mockChatStore.clear();
  removedFriendIds.clear();
}
