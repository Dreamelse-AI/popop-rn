/**
 * Story Bar 未读判定与排序
 *
 * - 已读：用户已看完该角色全部有效限时动态（headline story_ids 均已本地已读，或已标记 fullyRead）
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
  read: HeadlineReadSnapshot,
): boolean {
  if (read.isCharacterFullyRead(item.characterId)) return false;

  if (item.storyIds.length > 0) {
    return item.storyIds.some(id => !read.isStoryRead(id));
  }

  return item.unread;
}

/** 未读优先，区内按最新发布时间倒序 */
export function sortStoryHeadlineItems(
  items: StoryHeadline[],
  read: HeadlineReadSnapshot,
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
