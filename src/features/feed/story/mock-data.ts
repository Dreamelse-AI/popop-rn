/**
 * Story 头像栏 Mock 数据（使用 feed 本地素材）
 */

import type { StoryHeadlineResp } from './types'

/** 故意乱序，便于验证客户端「未读优先 + 区内按 latest_published_at 倒序」 */
const MOCK_HEADLINE_ITEMS: StoryHeadlineResp['items'] = [
  {
    character_id: 'c2',
    character_name: 'Luna',
    avatar: { id: '', url: 'https://picsum.photos/seed/story-avatar-2/200/200', media_type: 'image' },
    region: 'US',
    unread: false,
    story_count: 3,
    latest_published_at: Date.parse('2026-05-27T10:00:00Z'),
    story_ids: ['s3', 's4', 's5'],
  },
  {
    character_id: 'c1',
    character_name: 'Zara',
    avatar: { id: '', url: 'https://picsum.photos/seed/story-avatar-1/200/200', media_type: 'image' },
    region: 'US',
    unread: true,
    story_count: 2,
    latest_published_at: Date.parse('2026-05-27T11:00:00Z'),
    story_ids: ['s1', 's2'],
  },
  {
    character_id: 'c5',
    character_name: 'Yuki',
    avatar: { id: '', url: 'https://picsum.photos/seed/story-avatar-3/200/200', media_type: 'image' },
    region: 'US',
    unread: true,
    story_count: 1,
    latest_published_at: Date.parse('2026-05-27T12:00:00Z'),
    story_ids: ['s9'],
  },
  {
    character_id: 'c4',
    character_name: 'Mira',
    avatar: { id: '', url: 'https://picsum.photos/seed/story-avatar-4/200/200', media_type: 'image' },
    region: 'US',
    unread: false,
    story_count: 2,
    latest_published_at: Date.parse('2026-05-27T08:00:00Z'),
    story_ids: ['s7', 's8'],
  },
  {
    character_id: 'c3',
    character_name: 'Kai',
    avatar: { id: '', url: 'https://picsum.photos/seed/story-avatar-3/200/200', media_type: 'image' },
    region: 'US',
    unread: false,
    story_count: 1,
    latest_published_at: Date.parse('2026-05-27T09:30:00Z'),
    story_ids: ['s6'],
  },
];

/** 正常场景：2 未读 + 3 已读（API 乱序，由客户端排序） */
export function getMockHeadlineListNormal(): StoryHeadlineResp {
  return {
    state: 'normal',
    items: MOCK_HEADLINE_ITEMS,
  };
}

/** 无角色 → state=hidden，模块隐藏 */
export function getMockHeadlineListHidden(): StoryHeadlineResp {
  return {
    state: 'hidden',
    items: [],
  };
}

/** 有角色但无人发动态 → state=empty，展示空态文案 */
export function getMockHeadlineListEmpty(): StoryHeadlineResp {
  return {
    state: 'empty',
    items: [],
  };
}

/** 单角色，测试横滑边界 */
export function getMockHeadlineListSingle(): StoryHeadlineResp {
  const first = MOCK_HEADLINE_ITEMS[0]!;
  return {
    state: 'normal',
    items: [first],
  };
}

/** 默认返回的正常场景，改这里可快速切换 mock 行为 */
export function getMockHeadlineList(): StoryHeadlineResp {
  return getMockHeadlineListNormal();
}
