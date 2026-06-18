import { registerSessionClearListener } from '@/shared/session/clear-user-session';

import type { FeedLayoutItem } from './lib/feed-layout-engine';

/** Feed tab 离开时间，用于 30 分钟内回到 Feed 时恢复浏览位置 */
const FEED_TAB_STATE_TTL_MS = 30 * 60 * 1000;

/** 帖子模型变更时递增，避免恢复缺少 publishedAtMs 的旧快照 */
const FEED_LIST_SNAPSHOT_VERSION = 2;

let feedLeftAt: number | null = null;
let feedScrollTop: number | null = null;

type FeedListSnapshot = {
  version: number;
  items: FeedLayoutItem[];
  hasMore: boolean;
  savedAt: number;
};

let feedListSnapshot: FeedListSnapshot | null = null;

function isFeedSessionFresh(savedAt: number): boolean {
  return Date.now() - savedAt <= FEED_TAB_STATE_TTL_MS;
}

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

export function saveFeedScrollTop(top: number) {
  feedScrollTop = top;
}

export function takeFeedScrollTop(): number | null {
  const top = feedScrollTop;
  feedScrollTop = null;
  return top;
}

function isFeedListSnapshotValid(snapshot: FeedListSnapshot): boolean {
  if (!isFeedSessionFresh(snapshot.savedAt)) return false;
  if (snapshot.version !== FEED_LIST_SNAPSHOT_VERSION) return false;

  return snapshot.items.every(
    item => item.kind !== 'post' || Number.isFinite(item.post.publishedAtMs),
  );
}

export function getFeedListSnapshot(): Pick<FeedListSnapshot, 'items' | 'hasMore'> | null {
  if (!feedListSnapshot || !isFeedListSnapshotValid(feedListSnapshot)) {
    feedListSnapshot = null;
    return null;
  }

  return {
    items: feedListSnapshot.items,
    hasMore: feedListSnapshot.hasMore,
  };
}

export function saveFeedListSnapshot(items: FeedLayoutItem[], hasMore: boolean) {
  feedListSnapshot = {
    version: FEED_LIST_SNAPSHOT_VERSION,
    items,
    hasMore,
    savedAt: Date.now(),
  };
}

export function clearFeedSessionState() {
  feedLeftAt = null;
  feedScrollTop = null;
  feedListSnapshot = null;
}

registerSessionClearListener(clearFeedSessionState);

export const FEED_TAB_STATE_TTL = FEED_TAB_STATE_TTL_MS;
