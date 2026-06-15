import type {
  CharacterDraftItem,
  CharacterPageBasicInfo,
} from '@/generated/arca_apiComponents';

import { loadLocalDraftForm } from './lib/draft-local-store';
import {
  pickCoverUrlFromFormState,
  pickDisplayNameFromFormState,
} from './lib/form-mapper';
import type { CreationCharacterItem } from './types';

/** list_drafts 列表项 → 卡片展示数据（合并本地较新的编辑） */
export function mapDraftToCreationItem(draft: CharacterDraftItem): CreationCharacterItem {
  const local = loadLocalDraftForm(draft.draft_id);
  const serverUpdatedAt = draft.updated_at ?? 0;
  const form = draft.character_create_form;

  let name = form?.name?.trim() ?? '';
  const mainImage = form?.images?.find(img => img.is_main_pic) ?? form?.images?.[0];
  let coverUrl = mainImage?.url?.trim() ?? null;

  if (local?.draftId === draft.draft_id && local.localUpdatedAt > serverUpdatedAt * 1000) {
    const localName = pickDisplayNameFromFormState(local);
    const localCover = pickCoverUrlFromFormState(local);
    if (localName) name = localName;
    if (localCover) coverUrl = localCover;
  }

  return {
    id: draft.draft_id,
    name,
    coverUrl,
    status: 'draft',
    updatedAt: Math.max(
      serverUpdatedAt,
      local ? Math.floor(local.localUpdatedAt / 1000) : 0,
    ),
  };
}

export function mapPublishedToCreationItem(item: CharacterPageBasicInfo): CreationCharacterItem | null {
  const basic = item.basic_info;
  if (!basic?.character_id) return null;

  return {
    id: basic.character_id,
    name: basic.name?.trim() ?? '',
    coverUrl: basic.image?.url ?? null,
    status: 'published',
    updatedAt: item.last_active_at ?? 0,
  };
}
