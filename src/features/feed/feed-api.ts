/**
 * 首页 Feed API — POST /feed/recommendation
 */
import {
  feedMoreCharacters,
  feedRecallCharacters,
  feedRecommendation,
  getFeedTags,
  type FeedMoreCharactersReq,
  type FeedRecommendationReq,
} from '@/generated';

import {
  FEED_CHARACTER_ROW_PREVIEW_LIMIT,
  FEED_HOT_RECALL_STRATEGY,
  FEED_INTERACTION_RECALL_STRATEGY,
  FEED_MORE_CHARACTERS_STRATEGY,
  FEED_PAGE_SIZE,
} from './lib/feed-layout-config';
import { isNewFeedUser } from './lib/feed-user-context';
import {
  getFeedRankingSession,
  rememberCharacterTags,
  resetFeedRankingSession,
} from './lib/feed-ranking-session';
import type { FeedTopTag, HomeFeedCharacter, HomeFeedResponse } from './feed-types';
import { mapFeedEntities } from './feed-entity-mapper';

type FeedFetchMode = 'initial' | 'refresh' | 'load_more';
type MappedFeedEntities = ReturnType<typeof mapFeedEntities>;

function createFeedRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `feed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function prepareFeedSession(mode: FeedFetchMode) {
  if (mode === 'initial' || mode === 'refresh') {
    resetFeedRankingSession();
  }

  const session = getFeedRankingSession();
  if (!session.requestId) {
    session.requestId = createFeedRequestId();
  }

  if (mode === 'initial' || mode === 'refresh') {
    session.requestIndex = 1;
  } else {
    session.requestIndex += 1;
  }

  return session;
}

function buildRequest(mode: FeedFetchMode, tagKey?: string): FeedRecommendationReq {
  const session = prepareFeedSession(mode);

  return {
    request_id: session.requestId,
    request_index: session.requestIndex,
    limit: FEED_PAGE_SIZE,
    ...(tagKey ? { post_filter: { tag_key: tagKey } } : {}),
    ...(session.excludeIds.length ? { exclude_ids: session.excludeIds } : {}),
  };
}

function shouldFetchHotRecall(mode: FeedFetchMode, tagKey?: string): boolean {
  return !tagKey && (mode === 'initial' || mode === 'refresh');
}

function mergeUniqueCharacters(...sources: HomeFeedCharacter[][]): HomeFeedCharacter[] {
  const result: HomeFeedCharacter[] = [];
  const seen = new Set<string>();

  for (const characters of sources) {
    for (const character of characters) {
      if (seen.has(character.characterId)) continue;
      seen.add(character.characterId);
      result.push(character);
    }
  }

  return result;
}

async function fetchHotRecallCharacters(requestId?: string, limit = 20): Promise<MappedFeedEntities | null> {
  try {
    const resp = await feedRecallCharacters({
      ...(requestId ? { request_id: requestId } : {}),
      strategy: FEED_HOT_RECALL_STRATEGY,
      limit,
    });
    const mapped = mapFeedEntities(resp);
    return {
      ...mapped,
      characters: mapped.characters.map(character => ({
        ...character,
        recType: character.recType || FEED_HOT_RECALL_STRATEGY,
      })),
    };
  } catch (error) {
    console.error('[feed-api] hot recall characters failed:', error);
    return null;
  }
}

async function fetchRecommendation(mode: FeedFetchMode, tagKey?: string): Promise<HomeFeedResponse> {
  const req = buildRequest(mode, tagKey);
  const session = getFeedRankingSession();
  const hotRecallPromise = shouldFetchHotRecall(mode, tagKey)
    ? fetchHotRecallCharacters(session.requestId)
    : Promise.resolve(null);
  const [resp, hotRecall] = await Promise.all([
    feedRecommendation(req),
    hotRecallPromise,
  ]);
  const mapped = mapFeedEntities(resp);
  const characters = mergeUniqueCharacters(hotRecall?.characters ?? [], mapped.characters);
  const excludeIds = [...mapped.excludeIds, ...(hotRecall?.excludeIds ?? [])];
  const hasContent = mapped.stream.length > 0 || characters.length > 0;

  if (hasContent) {
    session.excludeIds = [...new Set([...session.excludeIds, ...excludeIds])];
    rememberCharacterTags(characters);
  }

  const postCount = mapped.stream.filter(item => item.type === 'post').length;

  return {
    stream: mapped.stream,
    characters,
    hasNewContent: hasContent,
    requestIndex: session.requestIndex,
    isNewUser: isNewFeedUser(),
    postCount,
  };
}

export const feedApi = {
  getFeed: (tagKey?: string | null) => fetchRecommendation('initial', tagKey ?? undefined),

  refreshFeed: (tagKey?: string | null) => fetchRecommendation('refresh', tagKey ?? undefined),

  loadMoreFeed: (tagKey?: string | null) => fetchRecommendation('load_more', tagKey ?? undefined),

  fetchFeedTags: async (): Promise<FeedTopTag[]> => {
    const resp = await getFeedTags();
    const tags = [...(resp.tags ?? [])]
      .filter(tag => tag.tag_name.trim())
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    return tags.map((tag, position) => ({
      id: tag.tag_key || String(tag.index),
      index: tag.index,
      name: tag.tag_name,
      filterKey: position === 0 ? null : tag.tag_key || String(tag.index),
    }));
  },

  /** 推荐「更多」页：拉取剩余角色（不影响首页 feed 会话状态） */
  fetchRecommendedMore: async (seedCharacterIds: string[], cursor?: string, limit = 20) => {
    const req: FeedMoreCharactersReq = {
      strategy: FEED_MORE_CHARACTERS_STRATEGY,
      seed_character_ids: seedCharacterIds,
      limit,
      ...(cursor ? { cursor } : {}),
    };
    const resp = await feedMoreCharacters(req);
    const mapped = mapFeedEntities(resp);
    return {
      characters: mapped.characters,
      nextCursor: resp.next_cursor || null,
      hasMore: Boolean(resp.next_cursor),
    };
  },

  /**
   * 互动触发角色推荐：点赞成功后按 post_id 调用 recall_characters(interaction)。
   */
  fetchInteractionCharacters: async (postId: string, requestId?: string) => {
    const resp = await feedRecallCharacters({
      ...(requestId ? { request_id: requestId } : {}),
      strategy: FEED_INTERACTION_RECALL_STRATEGY,
      interaction_post_id: postId,
      limit: FEED_CHARACTER_ROW_PREVIEW_LIMIT,
    });
    const mapped = mapFeedEntities(resp);
    rememberCharacterTags(mapped.characters);
    return mapped.characters;
  },
};
