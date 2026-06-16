/**
 * POST /post/list_by_character 响应 → FeedPostViewer UI 模型
 */
import type { PostInfo } from '@/generated';
import { toEpochMs } from '@/shared/lib/epoch-ms';
import { normalizeAssetUrl } from '@/shared/lib/normalize-asset-url';

import { hasPostBgm, resolvePostBgm } from './post-bgm';

export type CharacterPostView = {
  postId: string;
  content: string;
  images: string[];
  publishedAtMs: number;
  isLiked: boolean;
  hasBgm: boolean;
  bgmUrl?: string;
  bgmName?: string;
};

function normalizePostImageUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('//')) return normalizeAssetUrl(`https:${trimmed}`);
  return normalizeAssetUrl(trimmed);
}

function isRenderableImageUrl(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.startsWith('//')) return true;
  // Vite 打包资源、同源静态路径（mock / 本地素材）
  if (trimmed.startsWith('/')) return true;
  if (__DEV__ && trimmed.startsWith('file:')) return true;
  return false;
}

function resolveLinkedItemCover(post: PostInfo): string | undefined {
  for (const item of post.linked_items ?? []) {
    const coverUrl = item.cover?.url?.trim();
    if (coverUrl && isRenderableImageUrl(coverUrl)) {
      return normalizePostImageUrl(coverUrl);
    }
  }
  return undefined;
}

function resolvePostImages(post: PostInfo): string[] {
  const fromImages = (post.images ?? [])
    .map(media => media?.url?.trim())
    .filter(isRenderableImageUrl)
    .map(normalizePostImageUrl);

  if (fromImages.length > 0) return fromImages;

  const linkedCover = resolveLinkedItemCover(post);
  return linkedCover ? [linkedCover] : [];
}

/** 无 images 的帖子视为脏数据，不参与展示 */
export function isValidCharacterPost(post: PostInfo): boolean {
  return post.status === 2 && resolvePostImages(post).length > 0;
}

/** 仅取已发布且有图的帖子，按发布时间倒序 */
export function mapCharacterPosts(posts: PostInfo[]): CharacterPostView[] {
  return posts
    .filter(isValidCharacterPost)
    .map(post => {
      const bgm = resolvePostBgm(post);
      return {
        postId: post.post_id,
        content: post.content?.trim() ?? '',
        images: resolvePostImages(post),
        publishedAtMs: toEpochMs(post.published_at ?? post.created_at),
        isLiked: post.is_liked ?? false,
        hasBgm: hasPostBgm(post),
        bgmUrl: bgm.bgmUrl,
        bgmName: bgm.bgmName,
      };
    })
    .sort((a, b) => b.publishedAtMs - a.publishedAtMs);
}

export function countCharacterPostImages(posts: PostInfo[]): number {
  return mapCharacterPosts(posts).reduce((sum, post) => sum + post.images.length, 0);
}

/** 帖子详情 → FeedPostViewer 视图模型（点击 story 跳转用） */
export type PostDetailView = {
  postId: string;
  content: string;
  images: string[];
  characterName: string;
  characterAvatar: string;
  characterId: string;
  publishedAtMs: number;
  isLiked: boolean;
  bgmUrl?: string;
  bgmName?: string;
};

export function mapPostDetail(post: PostInfo): PostDetailView {
  const bgm = resolvePostBgm(post);
  return {
    postId: post.post_id,
    content: post.content?.trim() ?? '',
    images: resolvePostImages(post),
    characterName: post.author?.display_name ?? '',
    characterAvatar: post.author?.avatar?.url ?? '',
    characterId: post.author?.author_type === 2 ? post.author.author_id : '',
    publishedAtMs: toEpochMs(post.published_at ?? post.created_at),
    isLiked: post.is_liked ?? false,
    bgmUrl: bgm.bgmUrl,
    bgmName: bgm.bgmName,
  };
}
