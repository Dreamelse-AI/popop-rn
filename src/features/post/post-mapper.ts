/**
 * POST /post/list_by_character 响应 → FeedPostViewer UI 模型
 */
import type { PostInfo } from '@/generated';
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

function isRenderableImageUrl(value: string | undefined): value is string {
  if (!value) return false;
  if (/^https?:\/\//.test(value)) return true;
  // Vite 打包资源、同源静态路径（mock / 本地素材）
  return value.startsWith('/');
}

function resolvePostImages(post: PostInfo): string[] {
  return (post.images ?? [])
    .map(media => media?.url)
    .filter(isRenderableImageUrl)
    .map(normalizeAssetUrl);
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
        publishedAtMs: post.published_at ?? post.created_at,
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
    publishedAtMs: post.published_at ?? post.created_at,
    isLiked: post.is_liked ?? false,
    bgmUrl: bgm.bgmUrl,
    bgmName: bgm.bgmName,
  };
}
