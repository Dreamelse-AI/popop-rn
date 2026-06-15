/**
 * popop_search 响应 → 故事/聊天两个 tab 的 UI 模型
 */
import type { FeedPopopSearchResp } from '@/generated';

import type {
  DiscoverGridItem,
  FeedSearchResult,
  SearchChatItem,
  SearchStoryItem,
} from './types';

export function mapFeedPopopSearch(resp: FeedPopopSearchResp): FeedSearchResult {
  const stories: SearchStoryItem[] = [];
  const chats: SearchChatItem[] = [];

  for (const entity of resp.entities) {
    if (entity.entity_type === 'post' && entity.rec_post_entity) {
      const post = entity.rec_post_entity;
      stories.push({
        id: post.post_id,
        coverUrl: post.images?.[0]?.url ?? '',
        authorName: post.author_name ?? '',
        title: post.title ?? '',
        body: post.body ?? '',
      });
    } else if (entity.entity_type === 'character' && entity.rec_character_entity) {
      const character = entity.rec_character_entity;
      chats.push({
        id: character.character_id,
        avatar: character.appearance_media?.url ?? '',
        name: character.name ?? '',
        description: character.desc ?? '',
      });
    }
  }

  return { stories, chats };
}

/** popop_search 响应 → 初始态发现网格（按各实体取封面图，过滤无图项） */
export function mapDiscoverGrid(resp: FeedPopopSearchResp): DiscoverGridItem[] {
  return resp.entities
    .map((entity, index): DiscoverGridItem | null => {
      if (entity.entity_type === 'post' && entity.rec_post_entity) {
        const url = entity.rec_post_entity.images?.[0]?.url ?? '';
        return url ? { id: `post-${entity.rec_post_entity.post_id}-${index}`, coverUrl: url } : null;
      }
      if (entity.entity_type === 'character' && entity.rec_character_entity) {
        const url = entity.rec_character_entity.appearance_media?.url ?? '';
        return url
          ? { id: `char-${entity.rec_character_entity.character_id}-${index}`, coverUrl: url }
          : null;
      }
      return null;
    })
    .filter((item): item is DiscoverGridItem => item !== null);
}
