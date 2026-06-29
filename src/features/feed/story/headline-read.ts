/**
 * Story Bar 未读判定与排序
 *
 * - 未读高亮与排序均以 GET /story/headline 响应中的 unread 为准，不读本地已读缓存
 * - 排序：未读优先；未读/已读区内按 latestPublishedAt 倒序
 */
import type { StoryHeadline } from './types';

/** 头像栏单项是否应展示为未读（高亮描边 + 排在未读区） */
export function isHeadlineCharacterUnread(item: StoryHeadline): boolean {
  return item.unread;
}

/** 未读优先，区内按最新发布时间倒序 */
export function sortStoryHeadlineItems(items: StoryHeadline[]): StoryHeadline[] {
  return [...items].sort((a, b) => {
    if (a.unread !== b.unread) return a.unread ? -1 : 1;
    return b.latestPublishedAt - a.latestPublishedAt;
  });
}

/** 该角色 headline 上的全部有效 story 是否均已读（viewer 续看等本地逻辑用） */
export function areAllHeadlineStoriesRead(
  item: StoryHeadline,
  isStoryRead: (storyId: string) => boolean,
): boolean {
  if (item.storyIds.length === 0) return true;
  return item.storyIds.every(id => isStoryRead(id));
}
