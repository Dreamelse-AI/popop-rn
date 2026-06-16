import { getTaskStatus, submitCharacterDraft } from '@/generated/arca_api';
import type {
  GetTaskStatusResp,
  SubmitCharacterDraftResp,
} from '@/generated/arca_apiComponents';
import { randomUUID } from '@/shared/lib/random-uuid';

import { USE_CHARACTER_CREATION_MOCK, MOCK_CREATION_LATENCY_MS } from '../config';
import { finalizeMockSubmitDraft, mockDraftExists } from '../api/character-creation-api.mock';
import { pollSubmitIfNeeded } from './poll-async-task';

/** 服务端可能返回 task_id 走异步轮询（生成类型尚未包含） */
type SubmitCharacterDraftRespExtended = Partial<SubmitCharacterDraftResp> & {
  task_id?: string;
};

type MockSubmitDraftTask = {
  createdAt: number;
  draftId: string;
};

const mockSubmitDraftTasks = new Map<string, MockSubmitDraftTask>();

function isAsyncTaskSubmit(resp: SubmitCharacterDraftRespExtended): boolean {
  return Boolean(resp.task_id?.trim()) && !resp.character_id?.trim();
}

function resolveCharacterId(resp: SubmitCharacterDraftRespExtended): string {
  const characterId = resp.character_id?.trim();
  if (!characterId) {
    throw new Error('Missing character_id from character/submit_draft');
  }
  return characterId;
}

async function mockSubmitCharacterDraft(draftId: string): Promise<SubmitCharacterDraftRespExtended> {
  if (!mockDraftExists(draftId)) {
    throw new Error('Draft not found');
  }

  const taskId = randomUUID();
  mockSubmitDraftTasks.set(taskId, {
    createdAt: Date.now(),
    draftId,
  });
  return { task_id: taskId };
}

async function mockPollSubmitDraftTask(taskId: string): Promise<GetTaskStatusResp> {
  const record = mockSubmitDraftTasks.get(taskId);
  if (!record) {
    throw new Error('Mock submit draft task not found');
  }

  const elapsed = Date.now() - record.createdAt;
  const now = Date.now();

  if (elapsed < MOCK_CREATION_LATENCY_MS * 3) {
    return {
      task_id: taskId,
      task_type: 'submit_character_draft',
      status: 'processing',
      created_at: now - 1,
      updated_at: now,
    };
  }

  const result: SubmitCharacterDraftRespExtended = {
    character_id: finalizeMockSubmitDraft(record.draftId),
  };
  return {
    task_id: taskId,
    task_type: 'submit_character_draft',
    status: 'ready',
    result: JSON.stringify(result),
    created_at: now - 3,
    updated_at: now,
    finished_at: now,
  };
}

async function submitDraft(draftId: string): Promise<SubmitCharacterDraftRespExtended> {
  if (USE_CHARACTER_CREATION_MOCK) {
    return mockSubmitCharacterDraft(draftId);
  }
  return submitCharacterDraft({ draft_id: draftId }) as Promise<SubmitCharacterDraftRespExtended>;
}

/** 调用 `/character/submit_draft`；若返回 task_id 则轮询 `/task/get_status` 直到完成 */
export async function submitDraftWithTaskPoll(
  draftId: string,
  signal?: AbortSignal,
): Promise<{ resp: SubmitCharacterDraftRespExtended; characterId: string }> {
  const submitResp = await submitDraft(draftId);

  const result = await pollSubmitIfNeeded({
    submitResp,
    isAsync: isAsyncTaskSubmit,
    getTaskId: resp => resp.task_id!,
    toSyncResult: resp => resp,
    parseResult: json => JSON.parse(json) as SubmitCharacterDraftRespExtended,
    poll: USE_CHARACTER_CREATION_MOCK
      ? mockPollSubmitDraftTask
      : taskId => getTaskStatus({ task_id: taskId }),
    signal,
  });

  const characterId = resolveCharacterId(result);
  return { resp: result, characterId };
}
