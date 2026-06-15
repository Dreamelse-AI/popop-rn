/** 角色创作编辑页的三种数据来源 */
export type CharacterEditMode = 'create' | 'draft' | 'character';

export function resolveCharacterEditMode(input: {
  draftId?: string;
  mode?: string | null;
  characterId?: string | null;
}): CharacterEditMode {
  if (input.draftId) return 'draft';
  const characterId = input.characterId?.trim();
  const mode = input.mode;
  if (characterId && (mode === 'character' || mode === 'published')) {
    return 'character';
  }
  return 'create';
}

/** 已发布角色编辑入口：mode=character + characterId */
export function buildCharacterEditPath(characterId: string): string {
  return `/characters/create?mode=character&characterId=${encodeURIComponent(characterId)}`;
}

/** @deprecated 使用 buildCharacterEditPath */
export function buildPublishedCharacterEditPath(characterId: string): string {
  return buildCharacterEditPath(characterId);
}

export function buildDraftEditPath(draftId: string): string {
  return `/characters/create/${encodeURIComponent(draftId)}`;
}
