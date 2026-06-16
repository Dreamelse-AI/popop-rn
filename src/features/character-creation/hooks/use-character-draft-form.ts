import { useCallback, useEffect, useRef, useState } from 'react';

import * as creationApi from '../api/character-creation-api';
import type { CharacterEditMode } from '../lib/character-edit-mode';
import {
  CREATE_SESSION_STORAGE_ID,
  loadLocalDraftForm,
  removeLocalDraftForm,
  resolveDraftStorageId,
  saveLocalDraftForm,
} from '../lib/draft-local-store';
import {
  apiFormToDraftState,
  draftStateFromDraftDetail,
  isDraftFormContentEqual,
  draftStateToApiForm,
  mergeDraftFormState,
} from '../lib/form-mapper';
import { loadPublishedCharacterCreateForm } from '../lib/load-published-character-form';
import type { CharacterDraftFormState } from '../types/form';
import { createEmptyDraftFormState } from '../types/form';

const LOCAL_SAVE_DEBOUNCE_MS = 400;

type UseCharacterDraftFormOptions = {
  editMode?: CharacterEditMode;
  characterId?: string;
};

export type FlushToServerResult = { ok: true; draftId: string } | { ok: false };

type UseCharacterDraftFormResult = {
  form: CharacterDraftFormState | null;
  loading: boolean;
  saving: boolean;
  error: boolean;
  patchForm: (patch: Partial<CharacterDraftFormState>) => void;
  /** 有变更时保存到服务端；无变更则跳过 */
  flushToServer: () => Promise<FlushToServerResult>;
  reload: () => Promise<void>;
};

export function useCharacterDraftForm(
  draftId: string | undefined,
  options?: UseCharacterDraftFormOptions,
): UseCharacterDraftFormResult {
  const editMode = options?.editMode ?? 'create';
  const characterId = options?.characterId?.trim() ?? undefined;
  const isCharacterEdit = editMode === 'character' && Boolean(characterId);
  const isDraftEdit = editMode === 'draft' && Boolean(draftId);
  const storageId = resolveDraftStorageId(editMode, { draftId, characterId });

  const [form, setForm] = useState<CharacterDraftFormState | null>(null);
  const [loading, setLoading] = useState(isDraftEdit || isCharacterEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipLocalSaveRef = useRef(true);
  const initialFormRef = useRef<CharacterDraftFormState | null>(null);

  const loadDraft = useCallback(async (signal: { cancelled: boolean }) => {
    setLoading(isDraftEdit || isCharacterEdit);
    setError(false);

    try {
      if (editMode === 'create') {
        const local = loadLocalDraftForm(CREATE_SESSION_STORAGE_ID);
        const next = local ?? createEmptyDraftFormState('', 0);
        if (signal.cancelled) return;
        skipLocalSaveRef.current = true;
        initialFormRef.current = next;
        setForm(next);
        return;
      }

      if (isCharacterEdit && characterId) {
        const local = loadLocalDraftForm(storageId);
        const apiForm = await loadPublishedCharacterCreateForm(characterId);
        if (signal.cancelled) return;

        const serverState: CharacterDraftFormState = {
          ...apiFormToDraftState(local?.draftId ?? '', apiForm, 0),
          targetCharacterId: characterId,
          draftId: local?.draftId ?? '',
        };
        const merged =
          local && local.targetCharacterId === characterId
            ? mergeDraftFormState(serverState, local)
            : serverState;

        skipLocalSaveRef.current = true;
        initialFormRef.current = merged;
        setForm(merged);
        return;
      }

      if (isDraftEdit && draftId) {
        const local = loadLocalDraftForm(draftId);
        const resp = await creationApi.getCharacterDraftDetail({ draft_id: draftId });
        if (signal.cancelled) return;

        const serverState = draftStateFromDraftDetail(resp.draft);
        const merged = mergeDraftFormState(
          serverState,
          local?.draftId === draftId ? local : null,
        );

        skipLocalSaveRef.current = true;
        initialFormRef.current = merged;
        setForm(merged);
        return;
      }

      setError(true);
    } catch (e) {
      if (signal.cancelled) return;
      console.error('[useCharacterDraftForm] load failed:', e);

      if (editMode === 'create') {
        const local = loadLocalDraftForm(CREATE_SESSION_STORAGE_ID);
        const fallback = local ?? createEmptyDraftFormState('', 0);
        skipLocalSaveRef.current = true;
        initialFormRef.current = fallback;
        setForm(fallback);
        return;
      }

      const local = loadLocalDraftForm(storageId);
      if (local) {
        skipLocalSaveRef.current = true;
        initialFormRef.current = local;
        setForm(local);
      } else {
        setError(true);
      }
    } finally {
      if (!signal.cancelled) {
        setLoading(false);
      }
    }
  }, [characterId, draftId, editMode, isCharacterEdit, isDraftEdit, storageId]);

  useEffect(() => {
    const signal = { cancelled: false };
    void loadDraft(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [loadDraft]);

  const reload = useCallback(async () => {
    await loadDraft({ cancelled: false });
  }, [loadDraft]);

  const patchForm = useCallback((patch: Partial<CharacterDraftFormState>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...patch,
        localUpdatedAt: Date.now(),
      };
    });
  }, []);

  useEffect(() => {
    if (!form) return;

    if (skipLocalSaveRef.current) {
      skipLocalSaveRef.current = false;
      return;
    }

    if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
    localSaveTimerRef.current = setTimeout(() => {
      saveLocalDraftForm(form, storageId);
    }, LOCAL_SAVE_DEBOUNCE_MS);

    return () => {
      if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
    };
  }, [form, storageId]);

  const flushToServer = useCallback(async (): Promise<FlushToServerResult> => {
    if (!form || !initialFormRef.current) return { ok: false };

    if (localSaveTimerRef.current) {
      clearTimeout(localSaveTimerRef.current);
      localSaveTimerRef.current = null;
    }
    saveLocalDraftForm(form, storageId);

    if (isDraftFormContentEqual(form, initialFormRef.current)) {
      const draftId = form.draftId.trim();
      return draftId ? { ok: true, draftId } : { ok: false };
    }

    setSaving(true);
    try {
      const resp = await creationApi.saveCharacterDraft({
        draft_id: form.draftId || undefined,
        target_character_id:
          form.targetCharacterId ?? (isCharacterEdit ? characterId : undefined),
        character_create_form: draftStateToApiForm(form),
      });

      const synced: CharacterDraftFormState = {
        ...form,
        draftId: resp.draft_id,
        serverUpdatedAt: resp.updated_at,
        localUpdatedAt: resp.updated_at,
      };

      skipLocalSaveRef.current = true;
      initialFormRef.current = synced;
      setForm(synced);

      if (editMode === 'create') {
        removeLocalDraftForm(CREATE_SESSION_STORAGE_ID);
        saveLocalDraftForm(synced, resp.draft_id);
      } else {
        saveLocalDraftForm(synced, storageId);
      }

      return { ok: true, draftId: resp.draft_id };
    } catch (e) {
      console.error('[useCharacterDraftForm] flush failed:', e);
      return { ok: false };
    } finally {
      setSaving(false);
    }
  }, [characterId, editMode, form, isCharacterEdit, storageId]);

  return { form, loading, saving, error, patchForm, flushToServer, reload };
}
