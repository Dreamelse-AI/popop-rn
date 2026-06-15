/**
 * Feed 搜索域类型（UI 层 camelCase）
 */

export type FeedSearchType = 'post' | 'character';

/** 故事 tab：来自帖子实体 */
export type SearchStoryItem = {
  id: string;
  coverUrl: string;
  authorName: string;
  title: string;
  body: string;
};

/** 聊天 tab：来自角色实体 */
export type SearchChatItem = {
  id: string;
  avatar: string;
  name: string;
  description: string;
};

export type FeedSearchResult = {
  stories: SearchStoryItem[];
  chats: SearchChatItem[];
};

/** 初始态发现网格的单格（仅需封面图） */
export type DiscoverGridItem = {
  id: string;
  coverUrl: string;
};
