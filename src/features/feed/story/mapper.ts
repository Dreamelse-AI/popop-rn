/**
 * Story API 响应 → UI 模型映射
 */
import type { StoryHeadlineItem, StoryHeadlineResp } from '@/generated';

import type { HeadlineState, StoryHeadline, StoryHeadlineList } from './types';

export function mapStoryHeadlineItem(item: StoryHeadlineItem): StoryHeadline {
  return {
    characterId: item.character_id,
    characterName: item.character_name,
    characterAvatarUrl: item.avatar?.url ?? null,
    region: item.region,
    latestPublishedAt: item.latest_published_at,
    unread: item.unread,
    storyCount: item.story_count,
    storyIds: item.story_ids,
  };
}

export function mapStoryHeadlineList(resp: StoryHeadlineResp): StoryHeadlineList {
  return {
    state: resp.state as HeadlineState,
    items: resp.items.map(mapStoryHeadlineItem),
  };
}
