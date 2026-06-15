import {
  injectTimestampSeparators,
  stripTimestampSeparators,
} from './phone-message-adapter';
import type { ChatMessage } from '../model/types';

/** 可长按操作的消息（排除时间条、系统气泡、发送中） */
export function isRollbackableMessage(message: ChatMessage): boolean {
  if (message.type === 'timestamp' || message.type === 'system') return false;
  if ('status' in message && message.status === 'pending') return false;
  return true;
}

/** 解析 API message_id（含角色 text 按 \\n 拆分后的子气泡） */
export function resolveServerMessageId(message: ChatMessage): string | undefined {
  if ('serverMessageId' in message && message.serverMessageId) {
    return message.serverMessageId;
  }
  const match = message.id.match(/^(.+)-\d+$/);
  return match?.[1];
}

export function extractMessageCopyText(message: ChatMessage): string {
  switch (message.type) {
    case 'text':
      return message.text;
    case 'voice':
      return message.transcript ?? '';
    case 'emoji':
      return message.description;
    case 'image':
      return message.url;
    default:
      return '';
  }
}

/** 回溯用户消息时回填输入框的原文 */
export function extractUserRollbackDraft(message: ChatMessage): string {
  if (!('sender' in message) || message.sender !== 'user') return '';
  switch (message.type) {
    case 'text':
      return message.text;
    case 'voice':
      return message.transcript ?? '';
    default:
      return '';
  }
}

function findRollbackStartIndex(messages: ChatMessage[], target: ChatMessage): number {
  const targetServerId = resolveServerMessageId(target);

  if (targetServerId) {
    return messages.findIndex(message => {
      if (message.type === 'timestamp' || message.type === 'system') return false;
      return resolveServerMessageId(message) === targetServerId;
    });
  }

  return messages.findIndex(message => message.id === target.id);
}

/** 本地删除回溯点（含）及之后的消息，并重新计算时间分隔条 */
export function truncateMessagesFromRollback(
  messages: ChatMessage[],
  target: ChatMessage,
): ChatMessage[] {
  const startIndex = findRollbackStartIndex(messages, target);
  if (startIndex < 0) return messages;

  const kept = messages.slice(0, startIndex);
  return injectTimestampSeparators(stripTimestampSeparators(kept));
}
