import type { TFunction } from 'i18next';

/** 角色主页帖子 feed 时间（国际化） */
export function formatCharacterProfilePostTime(publishedAtMs: number, t: TFunction): string {
  if (!Number.isFinite(publishedAtMs) || publishedAtMs <= 0) return '';

  const now = Date.now();
  const diff = now - publishedAtMs;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('post.justNow');
  if (minutes < 60) return t('post.minutesAgo', { count: minutes });
  if (hours < 24) return t('post.hoursAgo', { count: hours });
  if (days < 7) return t('post.daysAgo', { count: days });

  const d = new Date(publishedAtMs);
  return `${d.getMonth() + 1}-${d.getDate()}`;
}

export function formatPostTime(dateStr: string, t: TFunction): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return t('post.justNow');
  if (minutes < 60) return t('post.minutesAgo', { count: minutes });
  if (hours < 24) return t('post.hoursAgo', { count: hours });

  const d = new Date(dateStr);
  const nowDate = new Date();
  const sameYear = d.getFullYear() === nowDate.getFullYear();
  const pad = (n: number) => String(n).padStart(2, '0');

  if (sameYear) {
    return `${d.getMonth() + 1}-${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
