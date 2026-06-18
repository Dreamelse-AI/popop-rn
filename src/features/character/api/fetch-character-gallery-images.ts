import * as mock from '@/features/character-creation/api/character-creation-api.mock';
import { USE_CHARACTER_CREATION_MOCK } from '@/features/character-creation/config';
import { getCharacterDetail } from '@/generated'

import { extractCharacterGalleryImages } from '../lib/extract-character-gallery-images';

export async function fetchCharacterGalleryImages(characterId: string): Promise<string[]> {
  if (!characterId.trim()) return [];

  if (USE_CHARACTER_CREATION_MOCK) {
    const form = await mock.getPublishedCharacterCreateForm(characterId);
    return (form.images ?? [])
      .map((img) => img.url?.trim())
      .filter((url): url is string => Boolean(url));
  }

  const resp = await getCharacterDetail({ character_id: characterId, source: 'direct' });
  return extractCharacterGalleryImages(resp.character);
}
