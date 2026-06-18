// Feed 数据类型定义：角色、限时动态、帖子

/** 首页 rec_popop 帖子卡片 */
export type HomeFeedPost = {
  postId: string;
  impressionId: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  content: string;
  imageUrl: string | null;
  /** rec_post_entity.images 数量大于 1 时为多图帖子 */
  hasMultipleImages: boolean;
  likeCount: number;
  isLiked: boolean;
  /** 发布时间（UTC 毫秒时间戳） */
  publishedAtMs: number;
  /** 是否附带背景音乐 */
  hasBgm: boolean;
  /** 帖子推荐来源（如 friend_new），待后端补充 */
  recSource?: string;
};

/** 首页 rec_popop HTML 运营卡片 */
export type HomeFeedPromo = {
  promoId: string;
  impressionId: string;
  htmlContent: string;
  coverUrl?: string;
  height?: number;
  jumpUrl?: string;
  bgColor?: string;
};

/** rec_popop 响应中有序的非角色实体（帖子 + 运营卡） */
export type FeedStreamItem =
  | { type: 'post'; post: HomeFeedPost }
  | { type: 'promo'; promo: HomeFeedPromo };

/** 首页 rec_popop 推荐角色卡片 */
export type HomeFeedCharacter = {
  characterId: string;
  impressionId: string;
  name: string;
  image: string;
  tags: string;
  desc: string;
  rawTags?: string[];
  likedCount?: number;
  recType?: string;
  /** IDL 暂未提供，后端补充后可展示聊过消息数 */
  chatMessageCount?: number;
};

export type { FeedLayoutItem, CharacterRowReason } from './lib/feed-layout-engine';

export type HomeFeedResponse = {
  stream: FeedStreamItem[];
  characters: HomeFeedCharacter[];
  hasNewContent: boolean;
  requestIndex: number;
  isNewUser: boolean;
  /** 本批 stream 中帖子数量，用于分页判断 */
  postCount: number;
};

export type Character = {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  tags: string[];
  chatCount: number;
};

export type FeedPost = {
  id: string;
  type: 'post' | 'character_card';
  characterId: string;
  characterName: string;
  characterAvatar: string;
  content: string;
  imageUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
};

export type FeedRefreshResponse = {
  items: FeedPost[];
  hasNewContent: boolean;
  nextCursor: string | null;
};

export type FeedTopTag = {
  id: string;
  index: number | undefined;
  name: string;
  filterKey: string | null;
};
