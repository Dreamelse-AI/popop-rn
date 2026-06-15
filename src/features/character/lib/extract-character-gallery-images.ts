import type { CharacterDetailInfo } from '@/generated/arca_apiComponents';

export function extractCharacterGalleryImages(character: CharacterDetailInfo): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const push = (url?: string) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    urls.push(trimmed);
  };

  for (const outfit of character.outfits ?? []) {
    for (const appearance of outfit.appearances ?? []) {
      push(appearance.image?.url);
    }
  }

  if (urls.length > 0) return urls;

  push(character.splash_img?.url);
  return urls;
}
