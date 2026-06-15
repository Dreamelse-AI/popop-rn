import { TIMESTAMP_GAP_MS } from '../config/chat-config';

const WEEKDAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'] as const;

function pad2(n: number) {
  return String(n).padStart(2, '0');
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
