import type { CreationFormImage } from '../types/form';
import { mapImagesToApi } from '../lib/form-mapper';
import { saveCharacterDraft } from './character-creation-api';

/** 将形象图（含标签）同步至草稿接口 */
export async function persistAppearanceImages(
  draftId: string,
  images: CreationFormImage[],
): Promise<void> {
  await saveCharacterDraft({
    draft_id: draftId,
    character_create_form: {
      images: mapImagesToApi(images),
    },
  });
}
