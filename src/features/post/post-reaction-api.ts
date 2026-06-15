import { addReaction, removeReaction } from '@/generated';

const POST_TARGET_TYPE = 1;
const LIKE_KIND = 1;

export const postReactionApi = {
  addLike: (postId: string, impressionId?: string) =>
    addReaction({
      target_type: POST_TARGET_TYPE,
      target_id: postId,
      kind: LIKE_KIND,
      ...(impressionId ? { impression_id: impressionId } : {}),
    }),

  removeLike: (postId: string) =>
    removeReaction({
      target_type: POST_TARGET_TYPE,
      target_id: postId,
      kind: LIKE_KIND,
    }),
};
