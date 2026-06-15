export type StoryItem = {
  id: string;
  type: 'image' | 'text';
  /** 帖子包含的所有图片 */
  images: string[];
  text?: string;
  /** 关联帖子 id（来自 story/viewer 的 content_id），点击 story 跳转帖子详情用 */
  contentId?: string;
  createdAt: string;
  musicName?: string;
  musicUrl?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
};

export type StoryCharacter = {
  id: string;
  name: string;
  avatar: string;
  hasUnread: boolean;
  stories: StoryItem[];
};

export type StoryViewerState = {
  characterIndex: number;
  storyIndex: number;
  isOpen: boolean;
};
