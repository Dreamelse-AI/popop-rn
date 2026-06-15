/**
 * Story Viewer / 互动 API：契约来自 IDL（goctl 生成）
 */
import {
  addReaction,
  getPostDetail,
  listPostsByCharacter,
  removeReaction,
  storyComment,
  storyViewMark,
  storyViewer,
  type ListPostsByCharacterReq,
  type StoryViewerReqParams,
} from '@/generated';
import { runPaidAction } from '@/shared/wallet';

const POST_TARGET_TYPE = 1 as const;
const LIKE_KIND = 1 as const;

export const storyApi = {
  getViewer: (params: StoryViewerReqParams) => storyViewer(params),

  /** 角色已发布帖子列表（IDL: POST /post/list_by_character） */
  listCharacterPosts: (req: ListPostsByCharacterReq) =>
    listPostsByCharacter(req),

  /** 帖子详情（IDL: POST /post/detail）；story 点击跳转用 content_id 拉取 */
  getPostDetail: (postId: string) =>
    getPostDetail({ post_id: postId, source: 'character_page' }),

  /** 已读上报（IDL: POST /story/view/mark） */
  markAsRead: (_characterId: string, storyId: string) =>
    storyViewMark({ story_id: storyId }),

  likeStory: (storyId: string) =>
    addReaction({ target_type: POST_TARGET_TYPE, target_id: storyId, kind: LIKE_KIND }),

  unlikeStory: (storyId: string) =>
    removeReaction({ target_type: POST_TARGET_TYPE, target_id: storyId, kind: LIKE_KIND }),

  replyToStory: async (storyId: string, content: string) => {
    const resp = await runPaidAction(
      () => storyComment({ story_id: storyId, content }),
      { source: 'story_comment' },
    );
    return resp;
  },
};
