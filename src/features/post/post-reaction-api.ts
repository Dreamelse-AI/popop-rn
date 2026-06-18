import { addReaction, removeReaction } from '@/generated';

// reaction target_type 枚举（IDL）：1-character 2-post 3-story
const POST_TARGET_TYPE = 2 as const;
const LIKE_KIND = 1 as const;

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
