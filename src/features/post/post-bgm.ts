import type { Media } from '@/generated';

export type PostBgmView = {
  bgmUrl?: string;
  bgmName?: string;
};

function isHttpUrl(value: string | undefined): value is string {
  return !!value && /^https?:\/\//.test(value);
}

function resolveBgmLabelFromUrl(url: string): string | undefined {
  const filename = url.split('/').pop()?.split('?')[0];
  if (!filename) return undefined;
  const base = filename.replace(/\.[^.]+$/, '');
  const segment = base.split('_').pop();
  return segment?.trim() || base.trim() || undefined;
}

function parseBgmMeta(meta?: string): PostBgmView {
  if (!meta) return {};
  try {
    const parsed = JSON.parse(meta) as { name?: string; title?: string; url?: string };
    return {
      bgmName: parsed.name ?? parsed.title,
      bgmUrl: parsed.url,
    };
  } catch {
    return { bgmName: meta };
  }
}

/** 与 StoryViewerStory.bgm / bgm_meta 解析规则保持一致 */
export function resolvePostBgm(post: { bgm?: Media; bgm_meta?: string }): PostBgmView {
  if (post.bgm?.url && isHttpUrl(post.bgm.url)) {
    return {
      bgmUrl: post.bgm.url,
      bgmName:
        post.bgm.name?.trim() ||
        resolveBgmLabelFromUrl(post.bgm.url) ||
        '背景音乐',
    };
  }
  return parseBgmMeta(post.bgm_meta);
}

export function hasPostBgm(post: { bgm?: Media; bgm_meta?: string }): boolean {
  const { bgmUrl } = resolvePostBgm(post);
  return Boolean(bgmUrl);
}
