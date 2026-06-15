import { storage } from '@/shared/storage';

const STORAGE_KEY = 'popop:creation-custom-tags:v1';

export function loadCustomCharacterTags(): string[] {
  try {
    const raw = storage.get(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function persistCustomCharacterTags(tags: string[]): void {
  try {
    storage.set(STORAGE_KEY, JSON.stringify(tags));
  } catch (e) {
    console.warn('[custom-tag-store] persist failed:', e);
  }
}

/** 新增自定义标签（去重，新的排在前面） */
export function appendCustomCharacterTag(tag: string): string[] {
  const trimmed = tag.trim();
  if (!trimmed) return loadCustomCharacterTags();

  const current = loadCustomCharacterTags();
  const next = [trimmed, ...current.filter((item) => item !== trimmed)];
  persistCustomCharacterTags(next);
  return next;
}

export function mergeTagOptions(...lists: Array<string[] | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const list of lists) {
    for (const tag of list ?? []) {
      const trimmed = tag.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      result.push(trimmed);
    }
  }

  return result;
}
