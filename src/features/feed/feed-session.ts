/** Feed tab 离开时间，用于 30 分钟内回到 Feed 时恢复浏览位置 */
const FEED_TAB_STATE_TTL_MS = 30 * 60 * 1000;

let feedLeftAt: number | null = null;

export function markFeedTabLeft() {
  feedLeftAt = Date.now();
}

export function clearFeedTabLeft() {
  feedLeftAt = null;
}

/** 离开 Feed 超过 30 分钟后再次进入，应重新刷新 */
export function shouldRefreshFeedOnReturn(): boolean {
  if (feedLeftAt === null) return false;
  return Date.now() - feedLeftAt > FEED_TAB_STATE_TTL_MS;
}

export const FEED_TAB_STATE_TTL = FEED_TAB_STATE_TTL_MS;
