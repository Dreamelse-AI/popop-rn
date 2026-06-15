/**
 * Story Bar 未读判定与排序
 *
 * - 未读高亮：GET /story/headline 的 unread=true 时始终以服务端为准（新帖、跨设备同步）
 * - 本地快照仅作 unread=false 时的补充（续看等），且不得覆盖服务端 unread=true
 * - 排序：未读优先；未读/已读区内按 latestPublishedAt 倒序
 */
import type { StoryHeadline } from './types';

export type HeadlineReadSnapshot = {
  isStoryRead: (storyId: string) => boolean;
  isCharacterFullyRead: (characterId: string) => boolean;
};

/** 头像栏单项是否应展示为未读（高亮描边 + 排在未读区） */
export function isHeadlineCharacterUnread(
  item: StoryHeadline,
  read?: HeadlineReadSnapshot,
): boolean {
  if (item.unread) return true;
  if (!read) return false;
  if (read.isCharacterFullyRead(item.characterId)) return false;
  if (item.storyIds.length > 0) {
    return item.storyIds.some(id => !read.isStoryRead(id));
  }
  return false;
}

/** 未读优先，区内按最新发布时间倒序 */
export function sortStoryHeadlineItems(
  items: StoryHeadline[],
  read?: HeadlineReadSnapshot,
): StoryHeadline[] {
  return [...items].sort((a, b) => {
    const aUnread = isHeadlineCharacterUnread(a, read);
    const bUnread = isHeadlineCharacterUnread(b, read);
    if (aUnread !== bUnread) return aUnread ? -1 : 1;
    return b.latestPublishedAt - a.latestPublishedAt;
  });
}

/** 该角色 headline 上的全部有效 story 是否均已读 */
export function areAllHeadlineStoriesRead(
  item: StoryHeadline,
  isStoryRead: (storyId: string) => boolean,
): boolean {
  if (item.storyIds.length === 0) return true;
  return item.storyIds.every(id => isStoryRead(id));
}
