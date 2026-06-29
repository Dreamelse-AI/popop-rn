import { TIMESTAMP_GAP_MS } from '../config/chat-config';

import type { FriendshipBasicInfo, PhoneMessageOutput } from '@/generated/arca_apiComponents';

const WEEKDAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'] as const;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function isDisplayTime(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function normalizeEpochToMs(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value < 1e12 ? value * 1000 : value;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 格式化单条消息时间戳（用于时间分隔条） */
export function formatMessageTimestamp(atMs: number, now = new Date()): string {
  const date = new Date(atMs);
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  const today = startOfDay(now);
  const target = startOfDay(date);
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86_400_000);

  if (diffDays === 0) return time;
  if (diffDays === 1) return `昨天 ${time}`;
  if (diffDays >= 2 && diffDays <= 7) {
    return `${WEEKDAY_LABELS[date.getDay()]} ${time}`;
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
}

export function shouldInsertTimestamp(prevAt: number | undefined, nextAt: number): boolean {
  if (prevAt === undefined) return true;
  const prev = new Date(prevAt);
  const next = new Date(nextAt);
  if (!isSameDay(prev, next)) return true;
  return nextAt - prevAt > TIMESTAMP_GAP_MS;
}

/** 会话列表右侧时间（今天 HH:mm / 昨天 / 年内 M/D / 跨年 YYYY/M/D） */
export function formatConversationListTime(atMs: number, nowMs = Date.now()): string {
  const normalizedAtMs = normalizeEpochToMs(atMs);
  if (normalizedAtMs <= 0) return '';

  const date = new Date(normalizedAtMs);
  const nowDate = new Date(nowMs);

  if (isSameDay(date, nowDate)) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }

  const yesterday = new Date(nowMs);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return '昨天';
  }

  if (date.getFullYear() === nowDate.getFullYear()) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

/** 后端返回的展示时间（字符串带时区时直接展示） */
export function resolvePhoneMessageDisplayTime(output: PhoneMessageOutput): string | undefined {
  const createdAt = output.created_at as unknown;
  if (isDisplayTime(createdAt)) return createdAt;
  return undefined;
}

/** 毫秒时间戳：排序、间隔判断等内部逻辑 */
export function resolvePhoneMessageAtMs(output: PhoneMessageOutput, fallback = Date.now()): number {
  const withMs = output as PhoneMessageOutput & { created_at_ms?: number };
  if (typeof withMs.created_at_ms === 'number') return normalizeEpochToMs(withMs.created_at_ms);
  if (typeof output.created_at === 'number') return normalizeEpochToMs(output.created_at);
  return fallback;
}

/** 会话列表：最近一条消息的展示时间 */
export function resolvePhoneMessageListTime(output: PhoneMessageOutput): string {
  const displayTime = resolvePhoneMessageDisplayTime(output);
  if (displayTime) return displayTime;
  return formatConversationListTime(resolvePhoneMessageAtMs(output, 0));
}

/** 好友列表展示时间（优先后端字符串，否则按时间戳格式化） */
export function resolveLastActiveDisplayTime(friend: FriendshipBasicInfo): string {
  const lastActive = friend.last_active_at as unknown;
  if (isDisplayTime(lastActive)) return lastActive;

  const lastActiveAtMs =
    typeof friend.last_active_at === 'number' ? normalizeEpochToMs(friend.last_active_at) : 0;
  return formatConversationListTime(lastActiveAtMs);
}
