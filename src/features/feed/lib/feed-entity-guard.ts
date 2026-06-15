/**
 * Feed 点击前校验：角色/帖子是否在浏览过程中被作者删除。
 */
import { getCharacterDetail, getPostDetail, type PostInfo } from '@/generated';

export const POST_STATUS_PUBLISHED = 2 as const;
export const POST_STATUS_DELETED = 3 as const;

export function isPostDeleted(post: PostInfo): boolean {
  return post.status === POST_STATUS_DELETED;
}

export function isPostPublished(post: PostInfo): boolean {
  return post.status === POST_STATUS_PUBLISHED;
}

export async function fetchFeedPostDetail(postId: string, impressionId?: string) {
  return getPostDetail({
    post_id: postId,
    source: 'feed',
    ...(impressionId ? { impression_id: impressionId } : {}),
  });
}

/** 角色仍可进入落地页时返回 true（接口失败视为已删除） */
export async function isCharacterAccessible(
  characterId: string,
  impressionId?: string,
): Promise<boolean> {
  if (!characterId) return false;

  try {
    await getCharacterDetail({
      character_id: characterId,
      source: 'feed',
      ...(impressionId ? { impression_id: impressionId } : {}),
    });
    return true;
  } catch {
    return false;
  }
}
