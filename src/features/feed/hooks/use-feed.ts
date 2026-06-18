/**
 * Feed 数据 Hook：首屏加载 + 下拉/Tab 刷新 + 滚动加载更多 + 排序布局。
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { feedApi } from '../feed-api';
import { getFeedListSnapshot, saveFeedListSnapshot } from '../feed-session';
import type { HomeFeedCharacter, HomeFeedPost, HomeFeedResponse, FeedStreamItem } from '../feed-types';
import {
  getPendingInsert,
  peekPendingInserts,
  recordPostLiked,
  removePendingInsert,
  resetFeedInteractions,
  setPendingInsertCharacters,
} from '../lib/feed-interaction-store';
import {
  buildFeedBatch,
  findCharacterRowAfterPost,
  replaceCharacterRowForPost,
  sanitizeAdjacentCharacterRows,
  type FeedLayoutItem,
} from '../lib/feed-layout-engine';
import {
  FEED_CHARACTER_INSERT_COOLDOWN,
  FEED_CHARACTER_ROW_PREVIEW_LIMIT,
  FEED_PAGE_SIZE,
} from '../lib/feed-layout-config';
import { getFeedRankingSession } from '../lib/feed-ranking-session';

export type FeedRefreshOutcome = 'success' | 'no_content' | 'error';

export type PostLikeState = {
  isLiked: boolean;
  likeCount: number;
};

export type PostLikedOptions = {
  /** 在帖子详情内点赞：先请求 rec_popop，关闭详情后再插入角色栏 */
  deferInsert?: boolean;
};

type UseFeedResult = {
  items: FeedLayoutItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadError: boolean;
  refresh: () => Promise<FeedRefreshOutcome>;
  loadMore: () => Promise<void>;
  syncPostLike: (postId: string, likeState: PostLikeState) => void;
  onPostLiked: (post: HomeFeedPost, likeState: PostLikeState, options?: PostLikedOptions) => void;
  onPostDetailClosed: (postId: string) => Promise<void>;
};

function logFeedLoadError(error: unknown, context: string) {
  console.error(context, error);
}

function appendUniqueItems(existing: FeedLayoutItem[], incoming: FeedLayoutItem[]): FeedLayoutItem[] {
  const keys = new Set(existing.map(item => item.key));
  const unique = incoming.filter(item => !keys.has(item.key));
  return [...existing, ...unique];
}

function toRowCharacters(characters: HomeFeedCharacter[]): HomeFeedCharacter[] {
  return characters.slice(0, FEED_CHARACTER_ROW_PREVIEW_LIMIT);
}

export function useFeed(): UseFeedResult {
  const restoredSnapshot = getFeedListSnapshot();
  const [items, setItems] = useState<FeedLayoutItem[]>(() => restoredSnapshot?.items ?? []);
  const [loading, setLoading] = useState(() => !restoredSnapshot);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(() => restoredSnapshot?.hasMore ?? true);
  const [loadError, setLoadError] = useState(false);
  const requestIdRef = useRef(0);
  const itemsRef = useRef(items);
  const hasMoreRef = useRef(hasMore);
  itemsRef.current = items;
  hasMoreRef.current = hasMore;

  const applyBatch = useCallback(
    (
      stream: FeedStreamItem[],
      characters: HomeFeedResponse['characters'],
      requestIndex: number,
      isNewUser: boolean,
      replace: boolean,
      postCount: number,
    ) => {
      const session = getFeedRankingSession();
      const pendingInserts = peekPendingInserts();
      let appliedPostIds: string[] = [];

      setItems(prev => {
        const leadingItems = replace ? [] : prev;
        const batch = buildFeedBatch({
          stream,
          characters,
          session,
          isNewUser,
          requestIndex,
          pendingInserts,
          leadingItems,
        });
        appliedPostIds = batch.appliedPostIds;

        const merged = replace ? batch.items : appendUniqueItems(prev, batch.items);
        return sanitizeAdjacentCharacterRows(merged);
      });

      for (const postId of appliedPostIds) {
        removePendingInsert(postId);
      }

      setHasMore(postCount >= FEED_PAGE_SIZE);
    },
    [],
  );

  const refresh = useCallback(async (): Promise<FeedRefreshOutcome> => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(false);
    setHasMore(true);

    try {
      resetFeedInteractions();
      const res = await feedApi.refreshFeed();
      if (requestId !== requestIdRef.current) return 'success';

      if (!res.hasNewContent) {
        return 'no_content';
      }

      applyBatch(res.stream, res.characters, res.requestIndex, res.isNewUser, true, res.postCount);
      return 'success';
    } catch (e) {
      if (requestId !== requestIdRef.current) return 'error';
      logFeedLoadError(e, '[useFeed] refresh failed:');
      setHasMore(false);
      setLoadError(true);
      return 'error';
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [applyBatch]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || loadError) return;

    const requestId = ++requestIdRef.current;
    setLoadingMore(true);

    try {
      const res = await feedApi.loadMoreFeed();
      if (requestId !== requestIdRef.current) return;
      if (!res.hasNewContent) {
        setHasMore(false);
        return;
      }

      applyBatch(res.stream, res.characters, res.requestIndex, res.isNewUser, false, res.postCount);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      logFeedLoadError(e, '[useFeed] load more failed:');
      setHasMore(false);
      setLoadError(true);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingMore(false);
      }
    }
  }, [applyBatch, hasMore, loadError, loading, loadingMore]);

  const loadInitial = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(false);
    setHasMore(true);

    try {
      resetFeedInteractions();
      const res = await feedApi.getFeed();
      if (requestId !== requestIdRef.current) return;
      if (res.hasNewContent) {
        applyBatch(res.stream, res.characters, res.requestIndex, res.isNewUser, true, res.postCount);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      logFeedLoadError(e, '[useFeed] initial load failed:');
      setHasMore(false);
      setLoadError(true);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [applyBatch]);

  useEffect(() => {
    if (getFeedListSnapshot()) return;
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    return () => {
      if (itemsRef.current.length > 0) {
        saveFeedListSnapshot(itemsRef.current, hasMoreRef.current);
      }
    };
  }, []);

  const syncPostLike = useCallback((postId: string, likeState: PostLikeState) => {
    setItems(prev =>
      prev.map(item =>
        item.kind === 'post' && item.post.postId === postId
          ? { ...item, post: { ...item.post, isLiked: likeState.isLiked, likeCount: likeState.likeCount } }
          : item,
      ),
    );
  }, []);

  const applyInteractionCharacterRow = useCallback((postId: string, rowCharacters: HomeFeedCharacter[]) => {
    if (!rowCharacters.length) return false;

    const session = getFeedRankingSession();
    const existingRow = findCharacterRowAfterPost(itemsRef.current, postId);

    if (existingRow) {
      removePendingInsert(postId);
      setItems(prev => replaceCharacterRowForPost(prev, postId, rowCharacters));
      return true;
    }

    if (session.postsSinceLastCharacterRow < FEED_CHARACTER_INSERT_COOLDOWN) {
      return false;
    }

    session.postsSinceLastCharacterRow = 0;
    session.postsSinceGuarantee = 0;
    removePendingInsert(postId);

    setItems(prev => {
      const postIndex = prev.findIndex(item => item.kind === 'post' && item.post.postId === postId);
      if (postIndex < 0) return prev;
      if (findCharacterRowAfterPost(prev, postId)) return prev;

      const nextItem = prev[postIndex + 1];
      if (nextItem?.kind === 'character_row') return prev;

      const rowItem: FeedLayoutItem = {
        kind: 'character_row',
        key: `character-row-interaction-${postId}-${rowCharacters.map(c => c.characterId).join(',')}`,
        characters: rowCharacters,
        anchorPostId: postId,
        reason: 'interaction',
      };

      const copy = [...prev];
      copy.splice(postIndex + 1, 0, rowItem);
      return sanitizeAdjacentCharacterRows(copy);
    });

    return true;
  }, []);

  const fetchInteractionCharacters = useCallback(async (post: HomeFeedPost) => {
    const session = getFeedRankingSession();
    const characters = await feedApi.fetchInteractionCharacters(post.postId, session.requestId);
    return toRowCharacters(characters);
  }, []);

  const handlePostLiked = useCallback(
    async (post: HomeFeedPost, likeState: PostLikeState, options?: PostLikedOptions) => {
      syncPostLike(post.postId, likeState);
      if (!likeState.isLiked) return;

      recordPostLiked(post.postId, post.characterId);

      try {
        const rowCharacters = await fetchInteractionCharacters(post);
        if (!rowCharacters.length) return;

        setPendingInsertCharacters(post.postId, rowCharacters);

        if (!options?.deferInsert) {
          applyInteractionCharacterRow(post.postId, rowCharacters);
        }
      } catch (e) {
        console.error('[useFeed] fetch interaction characters failed:', e);
      }
    },
    [applyInteractionCharacterRow, fetchInteractionCharacters, syncPostLike],
  );

  const onPostLiked = useCallback(
    (post: HomeFeedPost, likeState: PostLikeState, options?: PostLikedOptions) => {
      void handlePostLiked(post, likeState, options);
    },
    [handlePostLiked],
  );

  const onPostDetailClosed = useCallback(async (postId: string) => {
    const pending = getPendingInsert(postId);
    if (!pending?.characters?.length) return;

    applyInteractionCharacterRow(postId, pending.characters);
  }, [applyInteractionCharacterRow]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    loadError,
    refresh,
    loadMore,
    syncPostLike,
    onPostLiked,
    onPostDetailClosed,
  };
}
