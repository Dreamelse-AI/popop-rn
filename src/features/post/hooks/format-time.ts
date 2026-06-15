/** 角色主页帖子 feed 时间（如「1일 전」「5-27」） */
export function formatCharacterProfilePostTime(publishedAtMs: number): string {
  const now = Date.now();
  const diff = now - publishedAtMs;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  const d = new Date(publishedAtMs);
  return `${d.getMonth() + 1}-${d.getDate()}`;
}

export function formatPostTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;

  const d = new Date(dateStr);
  const nowDate = new Date();
  const sameYear = d.getFullYear() === nowDate.getFullYear();
  const pad = (n: number) => String(n).padStart(2, '0');

  if (sameYear) {
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
