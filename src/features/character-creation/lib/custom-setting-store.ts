import { storage } from '@/shared/storage';

const STORAGE_KEY = 'popop:creation-custom-settings:v1';

export type CustomSettingCategory = {
  key: string;
  label: string;
  emoji: string;
};

function slugify(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w一-鿿-]+/g, '');
  return base || `custom_${Date.now()}`;
}

export function loadCustomSettingCategories(): CustomSettingCategory[] {
  try {
    const raw = storage.get(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CustomSettingCategory =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as CustomSettingCategory).key === 'string' &&
        typeof (item as CustomSettingCategory).label === 'string',
    );
  } catch {
    return [];
  }
}

export function persistCustomSettingCategories(categories: CustomSettingCategory[]): void {
  try {
    storage.set(STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.warn('[custom-setting-store] persist failed:', e);
  }
}

export function appendCustomSettingCategory(label: string): CustomSettingCategory[] {
  const trimmed = label.trim();
  if (!trimmed) return loadCustomSettingCategories();

  const current = loadCustomSettingCategories();
  const existing = current.find((item) => item.label === trimmed);
  if (existing) return current;

  let key = slugify(trimmed);
  if (current.some((item) => item.key === key)) {
    key = `${key}_${Date.now()}`;
  }

  const next = [...current, { key, label: trimmed, emoji: '📝' }];
  persistCustomSettingCategories(next);
  return next;
}

export function mergeDetailSettingOptions<T extends { key: string; maxLength: number }>(
  preset: T[],
  custom: CustomSettingCategory[],
): T[] {
  const presetKeys = new Set(preset.map((item) => item.key));
  const extra = custom
    .filter((item) => !presetKeys.has(item.key))
    .map(
      (item) =>
        ({
          key: item.key,
          emoji: item.emoji,
          label: item.label,
          maxLength: 10,
        }) as unknown as T,
    );
  return [...preset, ...extra];
}
