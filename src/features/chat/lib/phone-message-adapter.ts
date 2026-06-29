import type { PhoneMessageForward, PhoneMessageInput, PhoneMessageOutput } from '@/generated/arca_apiComponents';
import { characterAssets } from '@/shared/assets/character';
import { randomUUID } from '@/shared/lib/random-uuid';

import { FOLLOW_UP_PROMPT, RE_FRIEND_GREETING_PROMPT } from '../config/chat-config';
import { getEmojiLabel } from './character-adapter';
import { splitTextBubbles } from './text-bubble-split';
import { formatMessageTimestamp, resolvePhoneMessageListTime, shouldInsertTimestamp } from './timestamp-format';
import { userVoiceDisplayDurationSec } from './voice-duration';
import type { ChatMessage } from '../model/types';

export function createLocalId() {
  return randomUUID();
}

/** 额外回复 / 重新加好友等触发的内部提示语，落库但不展示在聊天 UI */
export function isHiddenUserPromptOutput(output: PhoneMessageOutput): boolean {
  if (output.msg_direction !== 'user' || output.msg_type !== 'text') return false;
  const text = output.text?.text ?? '';
  return text === FOLLOW_UP_PROMPT || text === RE_FRIEND_GREETING_PROMPT;
}

/** @deprecated 使用 isHiddenUserPromptOutput */
export function isFollowUpPromptOutput(output: PhoneMessageOutput): boolean {
  return isHiddenUserPromptOutput(output);
}

export function filterVisiblePhoneMessages(
  outputs: PhoneMessageOutput[],
): PhoneMessageOutput[] {
  return outputs.filter(output => !isHiddenUserPromptOutput(output));
}

function parseMessageCursor(cursor?: string): bigint {
  if (!cursor) return 0n;
  try {
    return BigInt(cursor);
  } catch {
    return 0n;
  }
}

/** 轮询分页：排除锚点及已加载 cursor，避免边界重复 */
export function filterPhoneMessagesForNewerPage(
  outputs: PhoneMessageOutput[],
  anchorCursor: string,
  existingCursors: ReadonlySet<string> = new Set(),
): PhoneMessageOutput[] {
  const anchor = parseMessageCursor(anchorCursor);

  return filterVisiblePhoneMessages(outputs).filter(output => {
    if (!output.cursor) return true;
    const cursor = parseMessageCursor(output.cursor);
    if (cursor <= anchor) return false;
    return !existingCursors.has(output.cursor);
  });
}

/** 上滑分页：排除锚点及已加载 cursor，避免边界重复 */
export function filterPhoneMessagesForOlderPage(
  outputs: PhoneMessageOutput[],
  anchorCursor: string,
  existingCursors: ReadonlySet<string> = new Set(),
): PhoneMessageOutput[] {
  const anchor = parseMessageCursor(anchorCursor);

  return filterVisiblePhoneMessages(outputs).filter(output => {
    if (!output.cursor) return true;
    const cursor = parseMessageCursor(output.cursor);
    if (cursor >= anchor) return false;
    return !existingCursors.has(output.cursor);
  });
}

export function collectExistingCursors(messages: ChatMessage[]): Set<string> {
  const cursors = new Set<string>();
  for (const message of messages) {
    if (message.type === 'timestamp' || message.type === 'system') continue;
    if (message.cursor) cursors.add(message.cursor);
  }
  return cursors;
}

/** 从已加载消息中取最新 cursor，用于轮询锚点 */
export function getLatestCursorFromMessages(messages: ChatMessage[]): string | null {
  let latest = 0n;
  let latestCursor: string | null = null;

  for (const message of messages) {
    if (message.type === 'timestamp' || message.type === 'system') continue;
    if (!message.cursor) continue;
    const cursor = parseMessageCursor(message.cursor);
    if (cursor >= latest) {
      latest = cursor;
      latestCursor = message.cursor;
    }
  }

  return latestCursor;
}

/** 取较大 cursor，供 store 在本地 append 后同步 max 游标 */
export function maxMessageCursor(a: string | null, b?: string | null): string | null {
  if (!b) return a;
  if (!a) return b;
  return parseMessageCursor(b) >= parseMessageCursor(a) ? b : a;
}

/** 轮询 down 方向时使用的锚点：优先已加载消息，其次 store，最后 '0' */
export function resolvePollingAnchorCursor(input: {
  messages: ChatMessage[];
  historyMaxCursor: string | null;
}): string {
  return getLatestCursorFromMessages(input.messages) ?? input.historyMaxCursor ?? '0';
}

/** 从 latest_messages 中选出最新一条（created_at 相同时以 cursor 较大者为准） */
export function pickLatestPhoneMessage(
  messages?: PhoneMessageOutput[],
): PhoneMessageOutput | undefined {
  const visible = filterVisiblePhoneMessages(messages ?? []);
  if (visible.length === 0) return undefined;
  if (visible.length === 1) return visible[0];

  return visible.reduce((latest, message) => {
    const latestAt = latest.created_at ?? 0;
    const messageAt = message.created_at ?? 0;
    if (messageAt !== latestAt) {
      return messageAt > latestAt ? message : latest;
    }
    return parseMessageCursor(message.cursor) > parseMessageCursor(latest.cursor)
      ? message
      : latest;
  });
}

function voicePreviewDurationSec(message: PhoneMessageOutput): number {
  if (message.msg_direction === 'user') {
    return userVoiceDurationSec(message);
  }
  return characterVoiceDurationSec(message);
}

function resolvePhoneMessageText(text?: PhoneMessageOutput['text']): string {
  return text?.text?.trim() ?? '';
}

/** friend_request / friend_request_response：优先文本，其次开场白 */
function resolveFriendRequestMessageText(message: PhoneMessageOutput): string {
  const text = resolvePhoneMessageText(message.text);
  if (text) return text;
  return message.friend_request?.prologues?.find(item => item.trim())?.trim() ?? '';
}

function resolvePhoneMessageForward(output: PhoneMessageOutput) {
  return (
    output.chat_forward ??
    output.media_forward ??
    (output as PhoneMessageOutput & { forward?: PhoneMessageForward }).forward
  );
}

function resolveHtmlFileDescription(media?: { text?: string; desc?: string }): string {
  if (!media) return '';
  return media.text?.trim() || media.desc?.trim() || '';
}

/** HTML 链接卡片的未读态：以 is_click 为准，兼容仅有 is_read 的历史数据 */
function isLinkCardUnread(output: PhoneMessageOutput): boolean {
  if (output.is_click === true) return false;
  if (output.is_click === false) return true;
  return output.is_read === false;
}

/** 会话列表 preview 文案（与消息页第二行展示规则一致） */
export function formatPhoneMessagePreview(message: PhoneMessageOutput): string {
  if (message.msg_direction === 'system') {
    return resolvePhoneMessageText(message.text);
  }

  if (message.msg_type === 'text') {
    return resolvePhoneMessageText(message.text);
  }

  const outputText = resolvePhoneMessageText(message.text);
  if (outputText) return outputText;

  switch (message.msg_type) {
    case 'voice': {
      const transcript = message.voice?.text?.trim();
      if (transcript) return transcript;
      return `[语音] ${voicePreviewDurationSec(message)}"`;
    }
    case 'image':
      return '[图片]';
    case 'emoji': {
      if (message.emoji?.media) {
        const label = getEmojiLabel({
          emoji_id: message.emoji.emoji_id ?? '',
          media: message.emoji.media,
        });
        if (label !== '表情包') return label;
      }
      return '[表情]';
    }
    case 'gift':
      return message.gift?.name ? `[礼物] ${message.gift.name}` : '[礼物]';
    case 'invitation':
      return message.invitation?.title ?? message.invitation?.description ?? '[邀约]';
    case 'friend_request':
    case 'friend_request_response':
      return resolveFriendRequestMessageText(message);
    case 'html_file': {
      const media = message.html_file?.html_file;
      const name = media?.name?.trim();
      if (name) return `[链接] ${name}`;
      const desc = resolveHtmlFileDescription(media);
      return desc ? `[链接] ${desc}` : '[链接]';
    }
    case 'forward': {
      const forward = message.chat_forward ?? message.media_forward;
      return forward?.summary ?? forward?.title ?? '[转发]';
    }
    default:
      return '';
  }
}

function directionToSender(direction?: string): 'user' | 'character' | 'system' {
  if (direction === 'user') return 'user';
  if (direction === 'system') return 'system' as never;
  return 'character';
}

/** 从 latest_messages 中选出最新一条消息的展示时间 */
export function resolveLatestPhoneMessageDisplayTime(
  messages?: PhoneMessageOutput[],
): string {
  const latest = pickLatestPhoneMessage(messages);
  if (!latest) return '';
  return resolvePhoneMessageListTime(latest);
}

/**
 * latest_messages 中是否存在角色发来的未读消息（is_read === false）。
 * 用于置顶头像预览气泡的展示判定：仅当角色有未读消息时展示气泡。
 */
export function hasUnreadLatestPhoneMessage(messages?: PhoneMessageOutput[]): boolean {
  const visible = filterVisiblePhoneMessages(messages ?? []);
  return visible.some(
    message => message.msg_direction === 'character' && message.is_read === false,
  );
}

/** 语音未读：以 is_click 为准；兼容仅有 is_read 的历史 Mock 数据 */
function isVoiceUnread(output: PhoneMessageOutput): boolean {
  if (output.is_click === true) return false;
  if (output.is_click === false) return true;
  return output.is_read === false;
}

/** 用户语音展示时长：按 200字/60秒 计算，上限 60 秒 */
function userVoiceDurationSec(output: PhoneMessageOutput): number {
  return userVoiceDisplayDurationSec(output.voice?.text?.length ?? 0);
}

function characterVoiceDurationSec(output: PhoneMessageOutput): number {
  const ms = output.voice?.voice?.duration;
  if (ms && ms > 0) return Math.max(1, Math.ceil(ms / 1000));
  return userVoiceDisplayDurationSec(output.voice?.text?.length ?? 0);
}

type ExpandOptions = {
  emojiDescriptions?: Map<string, string>;
  splitCharacterText?: boolean;
};

/** API 单条消息 → 0~N 条 UI 消息（角色 text 可按 \\n 拆分） */
export function expandPhoneMessageOutput(
  output: PhoneMessageOutput,
  options: ExpandOptions = {},
): ChatMessage[] {
  const { emojiDescriptions, splitCharacterText = true } = options;
  const at = output.created_at ?? Date.now();
  const base = {
    at,
    serverMessageId: output.message_id,
    cursor: output.cursor,
  };

  if (output.msg_direction === 'system') {
    return [
      {
        id: output.message_id ?? createLocalId(),
        type: 'system',
        text: output.text?.text ?? '',
        at,
      },
    ];
  }

  const sender = directionToSender(output.msg_direction);
  const failed = output.is_failed ? ('failed' as const) : undefined;

  switch (output.msg_type) {
    case 'text': {
      const text = output.text?.text ?? '';
      if (sender === 'character' && splitCharacterText) {
        const parts = splitTextBubbles(text);
        if (parts.length === 0) return [];
        return parts.map((part, index) => ({
          id: `${output.message_id ?? createLocalId()}-${index}`,
          type: 'text' as const,
          sender: 'character' as const,
          text: part,
          ...base,
          serverMessageId: index === 0 ? output.message_id : undefined,
        }));
      }
      return [
        {
          id: output.message_id ?? createLocalId(),
          type: 'text',
          sender: sender === 'user' ? 'user' : 'character',
          text,
          status: sender === 'user' ? failed : undefined,
          ...base,
        },
      ];
    }
    case 'emoji': {
      const emojiId = output.emoji?.emoji_id ?? '';
      const url = output.emoji?.media?.url ?? (characterAssets.avatar1 as unknown as string);
      const description =
        emojiDescriptions?.get(emojiId) ??
        (output.emoji?.media
          ? getEmojiLabel({ emoji_id: emojiId, media: output.emoji.media })
          : '表情包');
      return [
        {
          id: output.message_id ?? createLocalId(),
          type: 'emoji',
          sender: sender === 'user' ? 'user' : 'character',
          emojiId,
          url,
          description,
          status: sender === 'user' ? failed : undefined,
          ...base,
        },
      ];
    }
    case 'image': {
      const url = output.image?.image?.url ?? '';
      if (!url) return [];
      return [
        {
          id: output.message_id ?? createLocalId(),
          type: 'image',
          sender: sender === 'user' ? 'user' : 'character',
          url,
          status: sender === 'user' ? failed : undefined,
          ...base,
        },
      ];
    }
    case 'voice':
      return [
        {
          id: output.message_id ?? createLocalId(),
          type: 'voice',
          sender: sender === 'user' ? 'user' : 'character',
          durationSec:
            sender === 'user' ? userVoiceDurationSec(output) : characterVoiceDurationSec(output),
          voiceUrl: output.voice?.voice?.url,
          transcript: output.voice?.text,
          unread: isVoiceUnread(output),
          status: sender === 'user' ? failed : undefined,
          ...base,
        },
      ];
    case 'forward': {
      const forward = resolvePhoneMessageForward(output);
      if (!forward) return [];
      const firstItem = forward.items?.[0];
      return [
        {
          id: output.message_id ?? createLocalId(),
          type: 'share_card',
          sender: sender === 'user' ? 'user' : 'character',
          authorName: forward.author_name || forward.source || firstItem?.sender_name || '',
          authorAvatar: forward.avatar?.url || firstItem?.sender_avatar?.url || '',
          content: forward.title ?? forward.summary ?? '',
          imageUrl: forward.cover?.url,
          sourceType: 'post',
          sourceId: forward.target_id ?? '',
          status: sender === 'user' ? failed : undefined,
          ...base,
        },
      ];
    }
    case 'html_file': {
      const media = output.html_file?.html_file;
      if (!media?.url) return [];
      return [
        {
          id: output.message_id ?? createLocalId(),
          type: 'link_card',
          sender: sender === 'user' ? 'user' : 'character',
          title: media.name?.trim() ?? '',
          description: resolveHtmlFileDescription(media),
          url: media.url,
          unread: sender === 'character' ? isLinkCardUnread(output) : undefined,
          clicked: output.is_click === true,
          status: sender === 'user' ? failed : undefined,
          ...base,
        },
      ];
    }
    case 'friend_request':
    case 'friend_request_response': {
      const text = resolveFriendRequestMessageText(output);
      if (!text) return [];
      return [
        {
          id: output.message_id ?? createLocalId(),
          type: 'text',
          sender: sender === 'user' ? 'user' : 'character',
          text,
          status: sender === 'user' ? failed : undefined,
          ...base,
        },
      ];
    }
    default:
      return [];
  }
}

export function toPhoneMessageInput(message: ChatMessage): PhoneMessageInput | null {
  switch (message.type) {
    case 'text':
      return { msg_type: 'text', text: { text: message.text } };
    case 'emoji':
      return {
        msg_type: 'emoji',
        emoji: {
          emoji_id: message.emojiId,
          media: { id: message.emojiId, url: message.url, media_type: 'image' },
        },
      };
    case 'image':
      return {
        msg_type: 'image',
        image: {
          image: { id: '', url: message.url, media_type: 'image' },
        },
      };
    case 'voice': {
      const voice = message.voiceUrl
        ? {
            id: '',
            url: message.voiceUrl,
            media_type: 'audio' as const,
            duration: message.durationSec * 1000,
          }
        : null;
      if (!voice?.url) return null;
      return {
        msg_type: 'voice',
        voice: {
          voice,
          text: message.transcript,
        },
      };
    }
    default:
      return null;
  }
}

export function createOptimisticTextMessage(text: string): ChatMessage {
  return {
    id: createLocalId(),
    type: 'text',
    sender: 'user',
    text,
    at: Date.now(),
    status: 'pending',
  };
}

export function createOptimisticVoiceMessage(input: {
  durationSec: number;
  voiceUrl: string;
  transcript?: string;
}): ChatMessage {
  return {
    id: createLocalId(),
    type: 'voice',
    sender: 'user',
    durationSec: input.durationSec,
    voiceUrl: input.voiceUrl,
    transcript: input.transcript,
    at: Date.now(),
    status: 'pending',
  };
}
export function createOptimisticEmojiMessage(emoji: {
  emoji_id: string;
  media: { url: string };
  description: string;
}): ChatMessage {
  return {
    id: createLocalId(),
    type: 'emoji',
    sender: 'user',
    emojiId: emoji.emoji_id,
    url: emoji.media.url,
    description: emoji.description,
    at: Date.now(),
    status: 'pending',
  };
}

export function createOptimisticImageMessage(input: { url: string }): ChatMessage {
  return {
    id: createLocalId(),
    type: 'image',
    sender: 'user',
    url: input.url,
    at: Date.now(),
    status: 'pending',
  };
}

type ApplyCurrentMessagesOptions = {
  /** 角色空回复时服务端可能仍标记 is_failed，此时不应展示红色感叹号 */
  ignoreServerFailed?: boolean;
};

/** 回写服务端 message_id，清除 pending */
export function applyCurrentMessages(
  localMessages: ChatMessage[],
  currentMessages: PhoneMessageOutput[],
  pendingLocalIds: string[],
  options?: ApplyCurrentMessagesOptions,
): ChatMessage[] {
  const next = [...localMessages];
  let pendingIndex = 0;

  for (const serverMsg of currentMessages) {
    const localId = pendingLocalIds[pendingIndex];
    pendingIndex += 1;
    if (!localId) break;

    const index = next.findIndex(m => m.id === localId);
    if (index === -1) continue;

    const existing = next[index];
    if (!existing) continue;

    if (
      existing.type === 'text' ||
      existing.type === 'emoji' ||
      existing.type === 'image' ||
      existing.type === 'voice'
    ) {
      next[index] = {
        ...existing,
        status:
          serverMsg.is_failed && !options?.ignoreServerFailed ? 'failed' : undefined,
        serverMessageId: serverMsg.message_id,
        cursor: serverMsg.cursor,
        at: serverMsg.created_at ?? existing.at,
        ...(existing.type === 'voice'
          ? {
              durationSec: userVoiceDurationSec(serverMsg),
              voiceUrl: serverMsg.voice?.voice?.url ?? existing.voiceUrl,
              transcript: serverMsg.voice?.text ?? existing.transcript,
            }
          : existing.type === 'image'
            ? {
                url: serverMsg.image?.image?.url || existing.url,
              }
            : {}),
      };
    }
  }

  return next;
}

/** 余额不足等失败场景：将 pending 消息标记为 failed */
export function markPendingByLocalIds(
  localMessages: ChatMessage[],
  localIds: string[],
): ChatMessage[] {
  if (localIds.length === 0) return localMessages;

  const idSet = new Set(localIds);
  return localMessages.map(message => {
    if (!idSet.has(message.id)) return message;
    if (
      message.type !== 'text' &&
      message.type !== 'emoji' &&
      message.type !== 'image' &&
      message.type !== 'voice'
    ) {
      return message;
    }
    if (message.status !== 'pending') return message;
    return { ...message, status: 'failed' as const };
  });
}

/** API 已成功时兜底清除仍带 pending 的本地消息（不依赖 current_messages 是否完整回写） */
export function clearPendingByLocalIds(
  localMessages: ChatMessage[],
  localIds: string[],
): ChatMessage[] {
  if (localIds.length === 0) return localMessages;

  const idSet = new Set(localIds);
  return localMessages.map(message => {
    if (!idSet.has(message.id)) return message;
    if (
      message.type !== 'text' &&
      message.type !== 'emoji' &&
      message.type !== 'image' &&
      message.type !== 'voice'
    ) {
      return message;
    }
    if (message.status !== 'pending') return message;
    return { ...message, status: undefined };
  });
}

export function injectTimestampSeparators(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length === 0) return [];

  const result: ChatMessage[] = [];
  let lastAt: number | undefined;

  for (const message of messages) {
    if (message.type === 'timestamp') {
      result.push(message);
      lastAt = message.at;
      continue;
    }

    if (shouldInsertTimestamp(lastAt, message.at)) {
      result.push({
        id: `ts-${message.at}-${message.id}`,
        type: 'timestamp',
        text: formatMessageTimestamp(message.at),
        at: message.at,
      });
    }

    result.push(message);
    lastAt = message.at;
  }

  return result;
}

export function phoneMessagesToDisplayList(
  outputs: PhoneMessageOutput[],
  options?: ExpandOptions,
): ChatMessage[] {
  const expanded = filterVisiblePhoneMessages(outputs).flatMap(o =>
    expandPhoneMessageOutput(o, options),
  );
  return injectTimestampSeparators(expanded);
}

export function stripTimestampSeparators(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(message => message.type !== 'timestamp');
}

/** 将更新的消息 append 到已有列表，并重新计算衔接处的时间分隔条 */
export function mergeNewerDisplayMessages(
  existing: ChatMessage[],
  newer: ChatMessage[],
): ChatMessage[] {
  const existingIds = new Set(
    stripTimestampSeparators(existing).map(message => message.id),
  );
  const newerUnique = stripTimestampSeparators(newer).filter(
    message => !existingIds.has(message.id),
  );

  if (newerUnique.length === 0) return existing;

  return injectTimestampSeparators([
    ...stripTimestampSeparators(existing),
    ...newerUnique,
  ]);
}

/** 将更早的历史 prepend 到已有列表，并重新计算衔接处的时间分隔条 */
export function mergeOlderDisplayMessages(
  older: ChatMessage[],
  existing: ChatMessage[],
): ChatMessage[] {
  const existingIds = new Set(
    stripTimestampSeparators(existing).map(message => message.id),
  );
  const olderUnique = stripTimestampSeparators(older).filter(
    message => !existingIds.has(message.id),
  );

  return injectTimestampSeparators([
    ...olderUnique,
    ...stripTimestampSeparators(existing),
  ]);
}

export function excludeDisplayMessagesByServerMessageIds(
  messages: ChatMessage[],
  serverMessageIds: ReadonlySet<string>,
): ChatMessage[] {
  if (serverMessageIds.size === 0) return messages;

  const filtered = stripTimestampSeparators(messages).filter(message => {
    if (message.type === 'timestamp') return false;
    if (!('serverMessageId' in message) || !message.serverMessageId) return true;
    return !serverMessageIds.has(message.serverMessageId);
  });

  return injectTimestampSeparators(filtered);
}

/** 构建播放队列：每条 UI 气泡 + 用于计算间隔的字数 */
export type PlaybackUnit = {
  message: ChatMessage;
  charCount: number;
};

export function buildPlaybackUnits(
  outputs: PhoneMessageOutput[],
  options?: ExpandOptions,
): PlaybackUnit[] {
  return outputs.flatMap(output => {
    const messages = expandPhoneMessageOutput(output, {
      ...options,
      splitCharacterText: true,
    });
    return messages.map(message => ({
      message,
      charCount: message.type === 'text' ? message.text.length : 0,
    }));
  });
}
