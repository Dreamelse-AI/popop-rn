import { create } from 'zustand';

import { ApiError } from '@/shared/api/api-client';
import { showGlobalToast } from '@/shared/wallet';

import * as creationApi from '../api/character-creation-api';
import { loadLocalDraftForm } from '../lib/draft-local-store';
import {
  draftStateFromDraftDetail,
  mergeDraftFormState,
  normalizeDraftConfigKeys,
  pickCoverUrlFromFormState,
  pickDisplayNameFromFormState,
} from '../lib/form-mapper';
import {
  buildPageConfigLookups,
  fetchCharacterPageConfig,
} from '../api/character-page-config-api';
import { DraftStatusPollError } from '../lib/poll-draft-status';
import { resumeDraftAuditPoll, submitDraftWithTaskPoll } from '../lib/submit-draft-with-task-poll';

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
  resumePublishPoll: (draftId: string) => Promise<{ characterId: string } | null>;
  isPublishing: (draftId: string) => boolean;
  dismissModal: () => void;
};

const inflightPromises = new Map<string, Promise<{ characterId: string } | null>>();
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
  if (error instanceof DraftStatusPollError) {
    const msg = error.rejectReason?.trim() || error.message.trim();
    return msg || null;
  }
  return null;
}

/** 新建发布：无 target_character_id；编辑已发布角色：有 target_character_id */
function isFirstCreateDraft(detail: { target_character_id?: string }): boolean {
  return !detail.target_character_id?.trim();
}

async function fetchDraftDetail(draftId: string) {
  const resp = await creationApi.getCharacterDraftDetail({ draft_id: draftId });
  const detail = resp.draft;
  if (!detail) {
    throw new Error('Draft not found');
  }
  return detail;
}

type DraftDisplayMeta = {
  isFirstCreate: boolean;
  characterName: string;
  coverUrl: string | null;
};

async function resolveDraftDisplayMeta(draftId: string): Promise<DraftDisplayMeta> {
  const detail = await fetchDraftDetail(draftId);
  let lookups;
  try {
    lookups = buildPageConfigLookups(await fetchCharacterPageConfig());
  } catch {
    lookups = undefined;
  }

  const serverForm = normalizeDraftConfigKeys(draftStateFromDraftDetail(detail, lookups), lookups);
  const localForm = loadLocalDraftForm(draftId);
  const form = mergeDraftFormState(serverForm, localForm);

  return {
    isFirstCreate: isFirstCreateDraft(detail),
    characterName: pickDisplayNameFromFormState(form),
    coverUrl: pickCoverUrlFromFormState(form),
  };
}

function resolveCharacterIdFromDetail(detail: {
  character_id?: string;
  target_character_id?: string;
}): string {
  const characterId = detail.character_id?.trim() || detail.target_character_id?.trim();
  if (!characterId) {
    throw new Error('Missing character_id on auditing draft');
  }
  return characterId;
}

function setPublishingJob(
  draftId: string,
  meta: DraftDisplayMeta,
  set: (partial: Partial<DraftPublishStore> | ((state: DraftPublishStore) => Partial<DraftPublishStore>)) => void,
  get: () => DraftPublishStore,
) {
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
}

function setPublishSuccess(
  draftId: string,
  meta: DraftDisplayMeta,
  characterId: string,
  set: (partial: Partial<DraftPublishStore> | ((state: DraftPublishStore) => Partial<DraftPublishStore>)) => void,
  get: () => DraftPublishStore,
) {
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
}

async function runPublishJob(
  draftId: string,
  set: (partial: Partial<DraftPublishStore> | ((state: DraftPublishStore) => Partial<DraftPublishStore>)) => void,
  get: () => DraftPublishStore,
): Promise<{ characterId: string }> {
  const meta = await resolveDraftDisplayMeta(draftId);

  setPublishingJob(draftId, meta, set, get);

  try {
    const { characterId } = await submitDraftWithTaskPoll(draftId);

    setPublishSuccess(draftId, meta, characterId, set, get);

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

async function runResumePublishJob(
  draftId: string,
  set: (partial: Partial<DraftPublishStore> | ((state: DraftPublishStore) => Partial<DraftPublishStore>)) => void,
  get: () => DraftPublishStore,
): Promise<{ characterId: string } | null> {
  const detail = await fetchDraftDetail(draftId);
  if (detail.status !== 'auditing') {
    return null;
  }

  const meta = await resolveDraftDisplayMeta(draftId);
  const characterId = resolveCharacterIdFromDetail(detail);
  setPublishingJob(draftId, meta, set, get);

  try {
    await resumeDraftAuditPoll(draftId);
    setPublishSuccess(draftId, meta, characterId, set, get);
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

function enqueuePublishJob(
  draftId: string,
  run: (
    draftId: string,
    set: (partial: Partial<DraftPublishStore> | ((state: DraftPublishStore) => Partial<DraftPublishStore>)) => void,
    get: () => DraftPublishStore,
  ) => Promise<{ characterId: string } | null>,
  set: (partial: Partial<DraftPublishStore> | ((state: DraftPublishStore) => Partial<DraftPublishStore>)) => void,
  get: () => DraftPublishStore,
): Promise<{ characterId: string } | null> {
  const existing = inflightPromises.get(draftId);
  if (existing) return existing;

  const promise = run(draftId, set, get).finally(() => {
    inflightPromises.delete(draftId);
  });

  inflightPromises.set(draftId, promise);
  return promise;
}

export const useDraftPublishStore = create<DraftPublishStore>((set, get) => ({
  jobs: {},
  modal: null,

  isPublishing: (draftId: string) => get().jobs[draftId]?.status === 'publishing',

  dismissModal: () => {
    set({ modal: null });
  },

  startPublish: (draftId: string) =>
    enqueuePublishJob(draftId, runPublishJob, set, get) as Promise<{ characterId: string }>,

  resumePublishPoll: (draftId: string) => enqueuePublishJob(draftId, runResumePublishJob, set, get),
}));
