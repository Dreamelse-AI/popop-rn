/** API 时间戳统一为毫秒（后端已切毫秒；仍兼容旧的秒级值） */
export function toEpochMs(timestamp: number): number {
  return timestamp > 1e12 ? timestamp : timestamp * 1000;
}
