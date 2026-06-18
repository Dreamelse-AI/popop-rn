import { useCallback, useEffect, useRef, useState } from 'react';

import * as creationApi from '../api/character-creation-api';
import { mapDraftToCreationItem, mapPublishedToCreationItem } from '../mapper';
import {
  subscribePublishSettled,
  useDraftPublishStore,
} from '../store/draft-publish-store';
import type { CreationCharacterItem } from '../types';

type UseCreationCharactersResult = {
  drafts: CreationCharacterItem[];
  published: CreationCharacterItem[];
  loading: boolean;
  error: boolean;
  creating: boolean;
  deletingId: string | null;
  isPublishing: (draftId: string) => boolean;
  refresh: () => Promise<void>;
  createDraft: () => Promise<string | null>;
  deleteItem: (item: CreationCharacterItem) => Promise<void>;
  publishDraft: (draftId: string) => Promise<void>;
};

export function useCreationCharacters(enabled: boolean): UseCreationCharactersResult {
  const startPublish = useDraftPublishStore(state => state.startPublish);
  const resumePublishPoll = useDraftPublishStore(state => state.resumePublishPoll);
  const jobs = useDraftPublishStore(state => state.jobs);
  const [drafts, setDrafts] = useState<CreationCharacterItem[]>([]);
  const [published, setPublished] = useState<CreationCharacterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const resumeAuditingDrafts = useCallback(
    (items: CreationCharacterItem[]) => {
      if (!enabled) return;

      items
        .filter(item => item.draftAuditStatus === 'auditing')
        .forEach(item => {
          void resumePublishPoll(item.id).catch(e => {
            console.error('[useCreationCharacters] resume publish poll failed:', item.id, e);
          });
        });
    },
    [enabled, resumePublishPoll],
  );

  const isPublishing = useCallback(
    (draftId: string) => {
      if (jobs[draftId]?.status === 'publishing') return true;
      const draft = drafts.find(item => item.id === draftId);
      return draft?.draftAuditStatus === 'auditing';
    },
    [jobs, drafts],
  );

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);

    try {
      const [draftResult, publishedResult] = await Promise.allSettled([
        creationApi.listCharacterDrafts(),
        creationApi.listUserCharacters({ limit: 50 }),
      ]);
      if (requestId !== requestIdRef.current) return;

      let nextDrafts: CreationCharacterItem[] = [];
      let nextPublished: CreationCharacterItem[] = [];

      if (draftResult.status === 'fulfilled') {
        nextDrafts = (draftResult.value.drafts ?? []).flatMap(draft => {
          try {
            return [mapDraftToCreationItem(draft)];
          } catch (e) {
            console.warn('[useCreationCharacters] skip invalid draft:', draft.draft_id, e);
            return [];
          }
        });
        setDrafts(nextDrafts);
        resumeAuditingDrafts(nextDrafts);
      } else {
        console.error('[useCreationCharacters] drafts fetch failed:', draftResult.reason);
      }

      if (publishedResult.status === 'fulfilled') {
        nextPublished = (publishedResult.value.characters ?? []).flatMap(item => {
          const mapped = mapPublishedToCreationItem(item);
          return mapped ? [mapped] : [];
        });
        setPublished(nextPublished);
      } else {
        console.error('[useCreationCharacters] published fetch failed:', publishedResult.reason);
      }

      if (
        draftResult.status === 'rejected' &&
        publishedResult.status === 'rejected'
      ) {
        setError(true);
      }
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      console.error('[useCreationCharacters] fetch failed:', e);
      setError(true);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [resumeAuditingDrafts]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    return subscribePublishSettled(() => {
      void refresh();
    });
  }, [enabled, refresh]);

  const createDraft = useCallback(async () => {
    setCreating(true);
    try {
      const resp = await creationApi.saveCharacterDraft({
        character_create_form: {},
      });
      await refresh();
      return resp.draft_id;
    } catch (e) {
      console.error('[useCreationCharacters] create draft failed:', e);
      return null;
    } finally {
      setCreating(false);
    }
  }, [refresh]);

  const deleteItem = useCallback(
    async (item: CreationCharacterItem) => {
      setDeletingId(item.id);
      try {
        if (item.status === 'draft') {
          await creationApi.deleteCharacterDraft({ draft_id: item.id });
        } else {
          await creationApi.deleteCharacter({ character_id: item.id });
        }
        await refresh();
      } catch (e) {
        console.error('[useCreationCharacters] delete failed:', e);
      } finally {
        setDeletingId(null);
      }
    },
    [refresh],
  );

  const publishDraft = useCallback(
    async (draftId: string) => {
      try {
        await startPublish(draftId);
      } catch (e) {
        console.error('[useCreationCharacters] publish failed:', e);
      }
    },
    [startPublish],
  );

  return {
    drafts,
    published,
    loading,
    error,
    creating,
    deletingId,
    isPublishing,
    refresh,
    createDraft,
    deleteItem,
    publishDraft,
  };
}
