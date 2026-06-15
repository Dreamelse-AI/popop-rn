/**
 * 帖子互动 API：契约来自 arca.api reaction 模块（target_type=1 post）
 */
import { addReaction, removeReaction } from '@/generated';

const POST_TARGET_TYPE = 1 as const;
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
