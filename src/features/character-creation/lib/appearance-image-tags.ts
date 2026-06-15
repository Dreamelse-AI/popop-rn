import { MAX_APPEARANCE_IMAGE_TAGS } from '../config';

/** 规范化单个形象标签：去首尾空白 */
export function normalizeAppearanceImageTag(tag: string): string {
  return tag.trim();
}

/** 规范化标签列表：去空、去重、截断上限 */
export function normalizeAppearanceImageTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tags) {
    const tag = normalizeAppearanceImageTag(raw);
    if (!tag) continue;

    const key = tag.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(tag);
    if (result.length >= MAX_APPEARANCE_IMAGE_TAGS) break;
  }

  return result;
}

/** 尝试追加标签，重复时返回 null */
export function appendAppearanceImageTag(
  tags: string[],
  rawTag: string,
): string[] | null {
  const tag = normalizeAppearanceImageTag(rawTag);
  if (!tag) return null;

  const normalized = normalizeAppearanceImageTags(tags);
  if (normalized.some((item) => item.toLowerCase() === tag.toLowerCase())) {
    return null;
  }
  if (normalized.length >= MAX_APPEARANCE_IMAGE_TAGS) {
    return null;
  }

  return [...normalized, tag];
}

/** 替换指定下标的标签，与其他标签重复时返回 null */
export function replaceAppearanceImageTag(
  tags: string[],
  index: number,
  rawTag: string,
): string[] | null {
  const tag = normalizeAppearanceImageTag(rawTag);
  if (!tag) return null;
  if (index < 0 || index >= tags.length) return null;

  const duplicate = tags.some(
    (item, itemIndex) => itemIndex !== index && item.toLowerCase() === tag.toLowerCase(),
  );
  if (duplicate) return null;

  const next = [...tags];
  next[index] = tag;
  return normalizeAppearanceImageTags(next);
}
