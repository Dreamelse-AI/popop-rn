import type { SubmitCharacterDraftResp } from '@/generated/arca_apiComponents';

import { USE_CHARACTER_CREATION_MOCK } from '../config';
import {
  getCharacterDraftStatus as mockGetCharacterDraftStatus,
  mockDraftExists,
} from '../api/character-creation-api.mock';
import { DraftStatusPollError, pollDraftAuditStatus, type PollDraftAuditStatusOptions } from './poll-draft-status';
import * as creationApi from '../api/character-creation-api';

function draftStatusPollOptions(): Pick<PollDraftAuditStatusOptions, 'poll'> {
  return USE_CHARACTER_CREATION_MOCK
    ? { poll: id => mockGetCharacterDraftStatus({ draft_id: id }) }
    : {};
}

function resolveCharacterId(resp: SubmitCharacterDraftResp): string {
  const characterId = resp.character_id?.trim();
  if (!characterId) {
    throw new Error('Missing character_id from character/submit_draft');
  }
  return characterId;
}

async function submitDraft(draftId: string): Promise<SubmitCharacterDraftResp> {
  if (USE_CHARACTER_CREATION_MOCK && !mockDraftExists(draftId)) {
    throw new Error('Draft not found');
  }

  return creationApi.submitCharacterDraft({ draft_id: draftId });
}

/** 调用 `/character/submit_draft`；若进入 auditing 则轮询 `/character/draft_status` 直到完成 */
export async function submitDraftWithTaskPoll(
  draftId: string,
  signal?: AbortSignal,
): Promise<{ resp: SubmitCharacterDraftResp; characterId: string }> {
  const submitResp = await submitDraft(draftId);
  const characterId = resolveCharacterId(submitResp);

  if (submitResp.draft_status === 'auditing') {
    await resumeDraftAuditPoll(draftId, signal);
  } else if (submitResp.draft_status === 'rejected') {
    throw new DraftStatusPollError('审核未通过');
  }

  return { resp: submitResp, characterId };
}

/** 页面刷新后恢复：仅轮询 `/character/draft_status`，不重复 submit */
export async function resumeDraftAuditPoll(draftId: string, signal?: AbortSignal): Promise<void> {
  await pollDraftAuditStatus({
    draftId,
    signal,
    ...draftStatusPollOptions(),
  });
}
