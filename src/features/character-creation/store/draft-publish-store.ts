import { create } from 'zustand';

import { ApiError } from '@/shared/api/api-client';
import { showGlobalToast } from '@/shared/wallet';

import * as creationApi from '../api/character-creation-api';
import { loadLocalDraftForm } from '../lib/draft-local-store';
import {
  draftStateFromDraftDetail,
  mergeDraftFormState,
  pickCoverUrlFromFormState,
  pickDisplayNameFromFormState,
} from '../lib/form-mapper';
import { AsyncTaskPollError } from '../lib/poll-async-task';
import { submitDraftWithTaskPoll } from '../lib/submit-draft-with-task-poll';

export type DraftPublishStatus = 'idle' | 'publishing' | 'success' | 'error';

export type DraftPublishJob = {
  draftId: string;
  status: DraftPublishStatus;
  isFirstCreate: boolean;
  characterId?: string;
  characterName?: string;
  coverUrl?: string | null;
  errorMessage?: string;
};

export type PublishSuccessModalState = {
  draftId: string;
  characterId: string;
  characterName: string;
  coverUrl: string | null;
};

type DraftPublishStore = {
  jobs: Record<string, DraftPublishJob>;
  modal: PublishSuccessModalState | null;
  startPublish: (draftId: string) => Promise<{ characterId: string }>;
  isPublishing: (draftId: string) => boolean;
  dismissModal: () => void;
};

const inflightPromises = new Map<string, Promise<{ characterId: string }>>();
const publishSettledListeners = new Set<() => void>();

export function subscribePublishSettled(listener: () => void): () => void {
  publishSettledListeners.add(listener);
  return () => {
    publishSettledListeners.delete(listener);
  };
}

function notifyPublishSettled() {
  publishSettledListeners.forEach(listener => {
    listener();
  });
}

function getResponseMsg(error: unknown): string | null {
  if (error instanceof ApiError) {
    const msg = error.message.trim();
    return msg || null;
  }
  if (error instanceof AsyncTaskPollError) {
    const msg = error.taskStatus?.error_message?.trim();
    return msg || null;
  }
  return null;
}

function isFirstCreateDraft(detail: {
  character_id?: string;
  target_character_id?: string;
}): boolean {
  return !detail.character_id?.trim() && !detail.target_character_id?.trim();
}

async function resolveDraftDisplayMeta(draftId: string): Promise<{
  isFirstCreate: boolean;
  characterName: string;
  coverUrl: string | null;
}> {
  const resp = await creationApi.getCharacterDraftDetail({ draft_id: draftId });

  const detail = resp.draft;
  if (!detail) {
    throw new Error('Draft not found');
  }

  const serverForm = draftStateFromDraftDetail(detail);
  const localForm = loadLocalDraftForm(draftId);
  const form = mergeDraftFormState(serverForm, localForm);

  return {
    isFirstCreate: isFirstCreateDraft(detail),
    characterName: pickDisplayNameFromFormState(form),
    coverUrl: pickCoverUrlFromFormState(form),
  };
}

async function runPublishJob(
  draftId: string,
  set: (partial: Partial<DraftPublishStore> | ((state: DraftPublishStore) => Partial<DraftPublishStore>)) => void,
  get: () => DraftPublishStore,
): Promise<{ characterId: string }> {
  const meta = await resolveDraftDisplayMeta(draftId);

  set({
    jobs: {
      ...get().jobs,
      [draftId]: {
        draftId,
        status: 'publishing',
        isFirstCreate: meta.isFirstCreate,
        characterName: meta.characterName,
        coverUrl: meta.coverUrl,
      },
    },
  });

  try {
    const { characterId } = await submitDraftWithTaskPoll(draftId);

    set({
      jobs: {
        ...get().jobs,
        [draftId]: {
          draftId,
          status: 'success',
          isFirstCreate: meta.isFirstCreate,
          characterId,
          characterName: meta.characterName,
          coverUrl: meta.coverUrl,
        },
      },
      modal: meta.isFirstCreate
        ? {
            draftId,
            characterId,
            characterName: meta.characterName,
            coverUrl: meta.coverUrl,
          }
        : get().modal,
    });

    return { characterId };
  } catch (error) {
    const errorMessage = getResponseMsg(error);
    if (errorMessage) {
      showGlobalToast(errorMessage);
    }

    set({
      jobs: {
        ...get().jobs,
        [draftId]: {
          draftId,
          status: 'error',
          isFirstCreate: meta.isFirstCreate,
          characterName: meta.characterName,
          coverUrl: meta.coverUrl,
          errorMessage: errorMessage ?? undefined,
        },
      },
    });

    throw error;
  } finally {
    notifyPublishSettled();
  }
}

export const useDraftPublishStore = create<DraftPublishStore>((set, get) => ({
  jobs: {},
  modal: null,

  isPublishing: (draftId: string) => get().jobs[draftId]?.status === 'publishing',

  dismissModal: () => {
    set({ modal: null });
  },

  startPublish: (draftId: string) => {
    const existing = inflightPromises.get(draftId);
    if (existing) return existing;

    const promise = runPublishJob(draftId, set, get).finally(() => {
      inflightPromises.delete(draftId);
    });

    inflightPromises.set(draftId, promise);
    return promise;
  },
}));
