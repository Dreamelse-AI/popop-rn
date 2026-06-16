/**
 * GET /story/viewer 响应 → StoryViewer UI 模型
 */
import type { StoryViewerResp, StoryViewerStory } from '@/generated';
import type { StoryHeadline } from '@/features/feed/story/types';
import { toEpochMs } from '@/shared/lib/epoch-ms';

import type { StoryCharacter, StoryItem } from './story-types';

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function toIsoTimestamp(publishedAt: number): string {
  return new Date(toEpochMs(publishedAt)).toISOString();
}

function resolveStoryImageUrl(story: StoryViewerStory): string | undefined {
  if (story.image?.url && isHttpUrl(story.image.url)) {
    return story.image.url;
  }
  if (story.content && isHttpUrl(story.content)) {
    return story.content;
  }
  return undefined;
}

function parseBgmMeta(meta?: string): Pick<StoryItem, 'musicName' | 'musicUrl'> {
  if (!meta) return {};
  try {
    const parsed = JSON.parse(meta) as { name?: string; title?: string; url?: string };
    return {
      musicName: parsed.name ?? parsed.title,
      musicUrl: parsed.url,
    };
  } catch {
    return { musicName: meta };
  }
}

function resolveBgmLabelFromUrl(url: string): string | undefined {
  const filename = url.split('/').pop()?.split('?')[0];
  if (!filename) return undefined;
  const base = filename.replace(/\.[^.]+$/, '');
  const segment = base.split('_').pop();
  return segment?.trim() || base.trim() || undefined;
}

function resolveStoryBgm(story: StoryViewerStory): Pick<StoryItem, 'musicName' | 'musicUrl'> {
  if (story.bgm?.url) {
    const name =
      story.bgm.name?.trim() ||
      resolveBgmLabelFromUrl(story.bgm.url) ||
      '背景音乐';
    return { musicName: name, musicUrl: story.bgm.url };
  }
  return parseBgmMeta(story.bgm_meta);
}

function mapStoryViewerStory(story: StoryViewerStory): StoryItem {
  const imageUrl = resolveStoryImageUrl(story);
  const text =
    story.content && !isHttpUrl(story.content) ? story.content : undefined;
  const { musicName, musicUrl } = resolveStoryBgm(story);

  return {
    id: story.story_id,
    type: imageUrl ? 'image' : 'text',
    images: imageUrl ? [imageUrl] : [],
    text,
    contentId: story.content_id?.trim() || undefined,
    createdAt: toIsoTimestamp(story.published_at),
    musicName,
    musicUrl,
    likeCount: 0,
    commentCount: 0,
    isLiked: story.liked,
  };
}

export function mapStoryViewerToCharacter(
  resp: StoryViewerResp,
  headline?: StoryHeadline,
): StoryCharacter | null {
  const stories = resp.stories.map(mapStoryViewerStory);
  if (stories.length === 0) return null;

  const avatar =
    headline?.characterAvatarUrl ??
    '';

  return {
    id: resp.character_id,
    name: resp.character_name || headline?.characterName || '',
    avatar,
    hasUnread: headline?.unread ?? resp.stories.some(s => !s.viewed),
    stories,
  };
}

export type StoryViewerSession = {
  characters: StoryCharacter[];
  initialCharacterIndex: number;
  initialStoryIndex: number;
};
