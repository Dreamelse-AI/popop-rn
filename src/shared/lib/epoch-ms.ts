/** API 时间戳统一为毫秒（后端已切毫秒；仍兼容旧的秒级值） */
export function toEpochMs(timestamp: number | string | null | undefined): number {
  if (timestamp == null || timestamp === '') return 0;

  if (typeof timestamp === 'string') {
    const numeric = Number(timestamp);
    if (Number.isFinite(numeric)) {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }
    const parsed = Date.parse(timestamp);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (!Number.isFinite(timestamp)) return 0;
  return timestamp > 1e12 ? timestamp : timestamp * 1000;
}
