/**
 * 帖子互动 API：契约来自 arca.api reaction 模块（target_type=2 post）
 */
import { addReaction, removeReaction } from '@/generated';

// reaction target_type 枚举（IDL）：1-character 2-post 3-story
const POST_TARGET_TYPE = 2 as const;
const LIKE_KIND = 1 as const;

export const postApi = {
  likePost: (postId: string, impressionId?: string) =>
    addReaction({
      target_type: POST_TARGET_TYPE,
      target_id: postId,
      kind: LIKE_KIND,
      ...(impressionId ? { impression_id: impressionId } : {}),
    }),

  unlikePost: (postId: string) =>
    removeReaction({
      target_type: POST_TARGET_TYPE,
      target_id: postId,
      kind: LIKE_KIND,
    }),
};
