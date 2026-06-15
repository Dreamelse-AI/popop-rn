/**
 * Story 头像栏 API — GET /story/headline（goctl 生成 storyHeadline）
 */
import { storyHeadline, type StoryHeadlineResp } from '@/generated';

export const storyApi = {
  getHeadlineList: (): Promise<StoryHeadlineResp> => storyHeadline(),
};
