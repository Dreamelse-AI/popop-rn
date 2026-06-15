import { storage } from '@/shared/storage';

import type { CharacterEditMode } from './character-edit-mode';
import type { CharacterDraftFormState } from '../types/form';

const STORAGE_PREFIX = 'popop:creation-draft:v1:';

/** 新建角色会话在 storage 中的固定 key（无服务端 draft_id） */
export const CREATE_SESSION_STORAGE_ID = '__create__';

const CHARACTER_STORAGE_PREFIX = 'char:';

function storageKey(storageId: string) {
  return `${STORAGE_PREFIX}${storageId}`;
}

export function resolveDraftStorageId(
  editMode: CharacterEditMode,
  ids: { draftId?: string; characterId?: string },
): string {
  if (editMode === 'character' && ids.characterId) {
    return `${CHARACTER_STORAGE_PREFIX}${ids.characterId}`;
  }
  if (editMode === 'create') {
    return CREATE_SESSION_STORAGE_ID;
  }
  return ids.draftId ?? CREATE_SESSION_STORAGE_ID;
}

export function loadLocalDraftForm(storageId: string): CharacterDraftFormState | null {
  try {
    const raw = storage.get(storageKey(storageId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CharacterDraftFormState;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalDraftForm(form: CharacterDraftFormState, storageId: string): void {
  try {
    storage.set(storageKey(storageId), JSON.stringify(form));
  } catch (e) {
    console.warn('[draft-local-store] save failed:', e);
  }
}

export function removeLocalDraftForm(storageId: string): void {
  storage.remove(storageKey(storageId));
}

/** 读取所有本地草稿（用于列表 merge）
 *  注意：MMKV 没有 key 枚举接口，因此此处无法遍历所有草稿。
 *  在 RN 中建议维护一个草稿 ID 列表或直接依赖服务端数据。
 *  当前实现返回空数组，保持接口兼容。
 */
export function listLocalDraftForms(): CharacterDraftFormState[] {
  // MMKV does not provide key enumeration in react-native-mmkv basic API.
  // Consumers should not rely on this for critical paths in RN.
  return [];
}
