/**
 * Story 域类型定义
 *
 * - API 类型：re-export 自 goctl 生成物（与 IDL 一致）
 * - StoryHeadline 等：组件层 camelCase，由 mapper 转换
 */
import type { StoryHeadlineItem } from '@/generated';

export type { Media, StoryHeadlineItem, StoryHeadlineResp } from '@/generated';

/** GET /story/headline 响应 state 枚举（与 IDL 一致） */
export type HeadlineState = 'hidden' | 'empty' | 'normal';

/** @deprecated 使用 StoryHeadlineItem */
export type StoryHeadlineItemApi = StoryHeadlineItem;

/** UI 层：头像栏中的单个角色 */
export type StoryHeadline = {
  characterId: string;
  characterName: string;
  characterAvatarUrl: string | null;
  region: string;
  latestPublishedAt: number;
  unread: boolean;
  storyCount: number;
  storyIds: string[];
};

export type StoryHeadlineList = {
  state: HeadlineState;
  items: StoryHeadline[];
};

export type StoryCharacterClickPayload = {
  characterId: string;
  index: number;
  item: StoryHeadline;
  headlineItems: StoryHeadline[];
  headlineState: HeadlineState;
};

export type StoryBarSectionRef = {
  refresh: () => Promise<void>;
};
