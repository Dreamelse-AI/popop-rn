import type { FeedStreamItem, HomeFeedCharacter, HomeFeedPost, HomeFeedPromo } from '../feed-types';
import type { PendingCharacterInsert } from './feed-interaction-store';
import {
  canShowPromoByExposureLimit,
  getPromoMinPostsInterval,
  recordPromoExposure,
} from './feed-promo-store';
import {
  FEED_CHARACTER_GUARANTEE_INTERVAL,
  FEED_CHARACTER_INSERT_COOLDOWN,
  FEED_CHARACTER_REC_TYPE,
  FEED_CHARACTER_ROW_PREVIEW_LIMIT,
  FEED_CHARACTER_ROW_SLOT_INDEX,
  FEED_FRIEND_POST_WINDOW,
  FEED_INITIAL_CHARACTER_BRUSH_COUNT,
  FEED_POST_REC_SOURCE,
} from './feed-layout-config';
import type { FeedRankingSession } from './feed-ranking-session';

export type CharacterRowReason = 'initial_hot' | 'interaction' | 'guarantee' | 'refreshed';

export type FeedLayoutItem =
  | { kind: 'post'; key: string; post: HomeFeedPost }
  | { kind: 'promo'; key: string; promo: HomeFeedPromo }
  | {
      kind: 'character_row';
      key: string;
      characters: HomeFeedCharacter[];
      anchorPostId?: string;
      reason: CharacterRowReason;
    };

type BuildBatchOptions = {
  stream: FeedStreamItem[];
  characters: HomeFeedCharacter[];
  session: FeedRankingSession;
  isNewUser: boolean;
  requestIndex: number;
  pendingInserts: PendingCharacterInsert[];
  /** 追加加载时传入已有列表末尾，用于跨批次冷却判断 */
  leadingItems?: FeedLayoutItem[];
};

export function sortCharactersByHotScore(characters: HomeFeedCharacter[]): HomeFeedCharacter[] {
  return [...characters].sort((a, b) => (b.likedCount ?? 0) - (a.likedCount ?? 0));
}

function takeCharacterRow(
  pool: HomeFeedCharacter[],
  preferRecType?: string,
): { row: HomeFeedCharacter[]; rest: HomeFeedCharacter[] } {
  const sorted = sortCharactersByHotScore(pool);
  const picked: HomeFeedCharacter[] = [];
  const used = new Set<string>();

  if (preferRecType) {
    for (const character of sorted) {
      if (character.recType !== preferRecType) continue;
      picked.push(character);
      used.add(character.characterId);
      if (picked.length >= FEED_CHARACTER_ROW_PREVIEW_LIMIT) break;
    }
  }

  for (const character of sorted) {
    if (used.has(character.characterId)) continue;
    picked.push(character);
    used.add(character.characterId);
    if (picked.length >= FEED_CHARACTER_ROW_PREVIEW_LIMIT) break;
  }

  const rest = pool.filter(character => !used.has(character.characterId));
  return { row: picked, rest };
}

function makeCharacterRow(
  characters: HomeFeedCharacter[],
  reason: CharacterRowReason,
  anchorPostId?: string,
): FeedLayoutItem | null {
  if (!characters.length) return null;
  const suffix = anchorPostId ? `-${anchorPostId}` : '';
  return {
    kind: 'character_row',
    key: `character-row-${reason}${suffix}-${characters.map(c => c.characterId).join(',')}`,
    characters,
    anchorPostId,
    reason,
  };
}

function canInsertCharacterRow(session: FeedRankingSession): boolean {
  return session.postsSinceLastCharacterRow >= FEED_CHARACTER_INSERT_COOLDOWN;
}

function isAdjacentToCharacterRow(items: FeedLayoutItem[]): boolean {
  return items[items.length - 1]?.kind === 'character_row';
}

function hasCharacterRowAfterFirstPost(items: FeedLayoutItem[]): boolean {
  const firstPostIndex = items.findIndex(item => item.kind === 'post');
  if (firstPostIndex < 0) return false;
  return items[firstPostIndex + 1]?.kind === 'character_row';
}

function markCharacterRowInserted(session: FeedRankingSession) {
  session.postsSinceLastCharacterRow = 0;
  session.postsSinceGuarantee = 0;
}

function tryInsertCharacterRow(
  items: FeedLayoutItem[],
  session: FeedRankingSession,
  charPool: HomeFeedCharacter[],
  reason: CharacterRowReason,
  preferRecType: string | undefined,
  anchorPostId?: string,
): { item: FeedLayoutItem | null; rest: HomeFeedCharacter[] } {
  if (!canInsertCharacterRow(session) || isAdjacentToCharacterRow(items) || charPool.length === 0) {
    return { item: null, rest: charPool };
  }

  const { row, rest } = takeCharacterRow(charPool, preferRecType);
  const item = makeCharacterRow(row, reason, anchorPostId);
  if (!item) return { item: null, rest: charPool };

  markCharacterRowInserted(session);
  return { item, rest };
}

function tryInsertPrefetchedCharacterRow(
  items: FeedLayoutItem[],
  session: FeedRankingSession,
  characters: HomeFeedCharacter[],
  reason: CharacterRowReason,
  anchorPostId?: string,
): FeedLayoutItem | null {
  if (!canInsertCharacterRow(session) || isAdjacentToCharacterRow(items) || characters.length === 0) {
    return null;
  }

  const row = characters.slice(0, FEED_CHARACTER_ROW_PREVIEW_LIMIT);
  const item = makeCharacterRow(row, reason, anchorPostId);
  if (!item) return null;

  markCharacterRowInserted(session);
  return item;
}

/** 移除相邻的重复角色栏（保留下方/后出现的一栏会被丢弃） */
export function sanitizeAdjacentCharacterRows(items: FeedLayoutItem[]): FeedLayoutItem[] {
  const result: FeedLayoutItem[] = [];

  for (const item of items) {
    const prev = result[result.length - 1];
    if (item.kind === 'character_row' && prev?.kind === 'character_row') {
      continue;
    }
    result.push(item);
  }

  return result;
}

function markPostShown(session: FeedRankingSession, post: HomeFeedPost, isNewUser: boolean) {
  session.exposedPostIds.add(post.postId);
  session.postsSinceLastCharacterRow += 1;
  session.postsSinceGuarantee += 1;
  session.postsSinceLastPromo += 1;

  if (!isNewUser) {
    session.friendWindowPostCount += 1;
    if (post.recSource === FEED_POST_REC_SOURCE.FRIEND_NEW) {
      session.friendWindowHasFriendPost = true;
    }
    if (session.friendWindowPostCount >= FEED_FRIEND_POST_WINDOW) {
      session.friendWindowPostCount = 0;
      session.friendWindowHasFriendPost = false;
    }
  }
}

/** 老用户：每 10 条窗口补 1 条好友新帖 */
export function applyFriendPostBoost(
  posts: HomeFeedPost[],
  session: FeedRankingSession,
  isNewUser: boolean,
): HomeFeedPost[] {
  if (isNewUser) return posts;

  const recall = [...session.friendPostRecall];

  for (const post of posts) {
    if (post.recSource !== FEED_POST_REC_SOURCE.FRIEND_NEW) continue;
    if (session.exposedPostIds.has(post.postId)) continue;
    if (recall.some(item => item.postId === post.postId)) continue;
    recall.push(post);
  }

  const boosted: HomeFeedPost[] = [];
  let windowCount = session.friendWindowPostCount;
  let windowHasFriend = session.friendWindowHasFriendPost;

  for (const post of posts) {
    if (boosted.some(item => item.postId === post.postId)) continue;

    boosted.push(post);
    windowCount += 1;
    if (post.recSource === FEED_POST_REC_SOURCE.FRIEND_NEW) {
      windowHasFriend = true;
    }

    if (windowCount >= FEED_FRIEND_POST_WINDOW && !windowHasFriend) {
      const candidate = recall.find(
        item => !session.exposedPostIds.has(item.postId) && !boosted.some(p => p.postId === item.postId),
      );
      if (candidate) {
        boosted.push(candidate);
        windowHasFriend = true;
      }
      windowCount = 0;
      windowHasFriend = false;
    }

    if (windowCount >= FEED_FRIEND_POST_WINDOW) {
      windowCount = 0;
      windowHasFriend = false;
    }
  }

  session.friendPostRecall = recall.filter(
    item => !session.exposedPostIds.has(item.postId) && !boosted.some(p => p.postId === item.postId),
  );
  session.friendWindowPostCount = windowCount;
  session.friendWindowHasFriendPost = windowHasFriend;

  return boosted;
}

function applyFriendBoostToStream(
  stream: FeedStreamItem[],
  session: FeedRankingSession,
  isNewUser: boolean,
): FeedStreamItem[] {
  const posts = stream
    .filter((item): item is { type: 'post'; post: HomeFeedPost } => item.type === 'post')
    .map(item => item.post);
  const boosted = applyFriendPostBoost(posts, session, isNewUser);
  let postCursor = 0;

  return stream
    .map(item => {
      if (item.type === 'promo') return item;
      const post = boosted[postCursor];
      postCursor += 1;
      return post ? { type: 'post' as const, post } : null;
    })
    .filter((item): item is FeedStreamItem => item !== null);
}

function shouldShowPromo(
  session: FeedRankingSession,
  promo: HomeFeedPromo,
  options?: { skipPostInterval?: boolean },
): boolean {
  if (session.shownPromoIds.has(promo.promoId)) return false;
  if (!options?.skipPostInterval && session.postsSinceLastPromo < getPromoMinPostsInterval()) {
    return false;
  }
  if (!canShowPromoByExposureLimit(promo.promoId)) return false;
  return true;
}

function markPromoShown(session: FeedRankingSession, promo: HomeFeedPromo) {
  session.shownPromoIds.add(promo.promoId);
  session.postsSinceLastPromo = 0;
  session.excludeIds = [...new Set([...session.excludeIds, `html:${promo.promoId}`])];
  recordPromoExposure(promo.promoId);
}

export function buildFeedBatch(options: BuildBatchOptions): {
  items: FeedLayoutItem[];
  appliedPostIds: string[];
} {
  const { session, isNewUser, requestIndex, pendingInserts, leadingItems = [] } = options;
  let charPool = sortCharactersByHotScore(options.characters);
  const stream = applyFriendBoostToStream(options.stream, session, isNewUser);
  const streamHasPosts = stream.some(item => item.type === 'post');
  const items: FeedLayoutItem[] = [];
  const insertsByPost = new Map(pendingInserts.map(item => [item.afterPostId, item]));
  const appliedPostIds = new Set<string>();

  let initialRowInserted = false;

  const shouldInsertInitialRow = (postIndex: number) =>
    !initialRowInserted &&
    requestIndex <= FEED_INITIAL_CHARACTER_BRUSH_COUNT &&
    postIndex === FEED_CHARACTER_ROW_SLOT_INDEX &&
    !hasCharacterRowAfterFirstPost([...leadingItems, ...items]);

  let postIndex = 0;

  for (const streamItem of stream) {
    if (streamItem.type === 'promo') {
      if (shouldShowPromo(session, streamItem.promo, { skipPostInterval: !streamHasPosts })) {
        items.push({
          kind: 'promo',
          key: `promo-${streamItem.promo.promoId}`,
          promo: streamItem.promo,
        });
        markPromoShown(session, streamItem.promo);
      }
      continue;
    }

    const post = streamItem.post;

    if (shouldInsertInitialRow(postIndex)) {
      const preferType = FEED_CHARACTER_REC_TYPE.HOT;
      const { item, rest } = tryInsertCharacterRow(
        [...leadingItems, ...items],
        session,
        charPool,
        'initial_hot',
        preferType,
      );
      charPool = rest;
      if (item) {
        items.push(item);
        initialRowInserted = true;
      }
    }

    items.push({ kind: 'post', key: `post-${post.postId}`, post });

    const pending = insertsByPost.get(post.postId);
    if (pending) {
      const reason = pending.replaceExisting ? 'refreshed' : 'interaction';

      if (pending.characters?.length) {
        const item = tryInsertPrefetchedCharacterRow(
          [...leadingItems, ...items],
          session,
          pending.characters,
          reason,
          post.postId,
        );
        if (item) {
          items.push(item);
          insertsByPost.delete(post.postId);
          appliedPostIds.add(post.postId);
        }
      } else {
        const preferType = isNewUser
          ? FEED_CHARACTER_REC_TYPE.HOT
          : FEED_CHARACTER_REC_TYPE.TAG_RELATED;
        const tag = pending.tags[0];
        const filtered = tag
          ? charPool.filter(character => character.rawTags?.includes(tag))
          : charPool;
        const source = filtered.length > 0 ? filtered : charPool;
        const { item, rest } = tryInsertCharacterRow(
          [...leadingItems, ...items],
          session,
          source,
          reason,
          preferType,
          post.postId,
        );
        charPool = rest;
        if (item) {
          items.push(item);
          insertsByPost.delete(post.postId);
          appliedPostIds.add(post.postId);
        }
      }
    }

    markPostShown(session, post, isNewUser);
    postIndex += 1;

    if (session.postsSinceGuarantee >= FEED_CHARACTER_GUARANTEE_INTERVAL) {
      const preferType = isNewUser
        ? FEED_CHARACTER_REC_TYPE.HOT
        : FEED_CHARACTER_REC_TYPE.PERSONALIZED;
      const { item, rest } = tryInsertCharacterRow(
        [...leadingItems, ...items],
        session,
        charPool,
        'guarantee',
        preferType,
        post.postId,
      );
      charPool = rest;
      if (item) {
        items.push(item);
      }
    }
  }

  if (
    !initialRowInserted &&
    requestIndex <= FEED_INITIAL_CHARACTER_BRUSH_COUNT &&
    items.some(item => item.kind === 'post') &&
    !hasCharacterRowAfterFirstPost([...leadingItems, ...items])
  ) {
    const preferType = FEED_CHARACTER_REC_TYPE.HOT;
    const { item, rest } = tryInsertCharacterRow(
      [...leadingItems, ...items],
      session,
      charPool,
      'initial_hot',
      preferType,
    );
    charPool = rest;
    if (item) {
      const firstPostIndex = items.findIndex(entry => entry.kind === 'post');
      items.splice(firstPostIndex + 1, 0, item);
      initialRowInserted = true;
    }
  }

  // 本批无帖子时（仅角色/运营卡召回），仍需展示角色栏
  if (!streamHasPosts && charPool.length > 0) {
    const isInitialBrush = requestIndex <= FEED_INITIAL_CHARACTER_BRUSH_COUNT;
    const preferType = isInitialBrush
      ? FEED_CHARACTER_REC_TYPE.HOT
      : isNewUser
        ? FEED_CHARACTER_REC_TYPE.HOT
        : FEED_CHARACTER_REC_TYPE.PERSONALIZED;
    const { item, rest } = tryInsertCharacterRow(
      [...leadingItems, ...items],
      session,
      charPool,
      isInitialBrush ? 'initial_hot' : 'guarantee',
      preferType,
    );
    charPool = rest;
    if (item) {
      items.push(item);
    }
  }

  return { items: sanitizeAdjacentCharacterRows(items), appliedPostIds: [...appliedPostIds] };
}

/** 刷新某帖正下方的角色栏（就地替换，不新增行） */
export function replaceCharacterRowForPost(
  items: FeedLayoutItem[],
  postId: string,
  characters: HomeFeedCharacter[],
): FeedLayoutItem[] {
  if (!characters.length) return items;

  const row = characters.slice(0, FEED_CHARACTER_ROW_PREVIEW_LIMIT);
  const postIndex = items.findIndex(item => item.kind === 'post' && item.post.postId === postId);
  if (postIndex < 0) return items;

  const nextItem = items[postIndex + 1];
  if (nextItem?.kind !== 'character_row') return items;

  const copy = [...items];
  copy[postIndex + 1] = {
    ...nextItem,
    key: `character-row-refreshed-${postId}-${row.map(c => c.characterId).join(',')}`,
    characters: row,
    anchorPostId: postId,
    reason: 'refreshed',
  };
  return copy;
}

export function findCharacterRowAfterPost(
  items: FeedLayoutItem[],
  postId: string,
): FeedLayoutItem | null {
  const postIndex = items.findIndex(item => item.kind === 'post' && item.post.postId === postId);
  if (postIndex < 0) return null;
  const next = items[postIndex + 1];
  return next?.kind === 'character_row' ? next : null;
}
