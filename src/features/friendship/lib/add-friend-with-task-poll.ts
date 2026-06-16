import { addFriend, getTaskStatus } from '@/generated/arca_api';
import type {
  AddFriendReq,
  AddFriendResp,
  CharacterCreateForm,
  GetTaskStatusResp,
} from '@/generated/arca_apiComponents';

type AddFriendReqExtended = AddFriendReq & {
  character_create_form?: CharacterCreateForm;
};
type AddFriendRespExtended = Partial<AddFriendResp> & {
  task_id?: string;
  character_id?: string;
};

import { randomUUID } from '@/shared/lib/random-uuid';

import { USE_MOCK as USE_CHAT_MOCK } from '@/features/chat/api/chat-api';
import { MOCK_CREATION_LATENCY_MS } from '@/features/character-creation/config';
import { pollSubmitIfNeeded } from '@/features/character-creation/lib/poll-async-task';
import * as mock from '@/features/friendship/lib/friendship-api.mock';
import { applyReFriendHandoff } from '@/features/friendship/lib/re-friend-handoff-bridge';

const USE_MOCK = USE_CHAT_MOCK;

export type AddFriendSubmitInput =
  | { kind: 'character'; characterId: string }
  | { kind: 'form'; characterCreateForm: CharacterCreateForm };

type MockAddFriendTask = {
  createdAt: number;
  characterId: string;
  result: AddFriendRespExtended;
};

const mockAddFriendTasks = new Map<string, MockAddFriendTask>();

function buildAddFriendReq(input: AddFriendSubmitInput): AddFriendReqExtended {
  if (input.kind === 'character') {
    return { character_id: input.characterId };
  }
  return { character_id: '', character_create_form: input.characterCreateForm };
}

function isAsyncTaskSubmit(resp: AddFriendRespExtended): boolean {
  return Boolean(resp.task_id?.trim()) && !resp.friendship_id;
}

function resolveCharacterId(resp: AddFriendRespExtended, fallbackId?: string): string {
  const characterId = resp.character_id?.trim() || fallbackId?.trim();
  if (!characterId) {
    throw new Error('Missing character_id from friendship/add');
  }
  return characterId;
}

async function mockSubmitAddFriend(req: AddFriendReqExtended): Promise<AddFriendRespExtended> {
  if (req.character_create_form) {
    const taskId = randomUUID();
    const characterId = `mock-char-${Date.now()}`;
    mockAddFriendTasks.set(taskId, {
      createdAt: Date.now(),
      characterId,
      result: {
        character_id: characterId,
        friendship_id: `friendship-${characterId}`,
        character_save_id: `save-${characterId}`,
        character_version_no: 1,
        is_new: true,
      },
    });
    return { task_id: taskId };
  }

  if (!req.character_id) {
    throw new Error('character_id is required for mock add friend');
  }

  return mock.addFriend(req);
}

async function mockPollAddFriendTask(taskId: string): Promise<GetTaskStatusResp> {
  const record = mockAddFriendTasks.get(taskId);
  if (!record) {
    throw new Error('Mock add friend task not found');
  }

  const elapsed = Date.now() - record.createdAt;
  const now = Date.now();

  if (elapsed < MOCK_CREATION_LATENCY_MS * 3) {
    return {
      task_id: taskId,
      task_type: 'add_friend',
      status: 'processing',
      created_at: now - 1,
      updated_at: now,
    };
  }

  return {
    task_id: taskId,
    task_type: 'add_friend',
    status: 'ready',
    result: JSON.stringify(record.result),
    created_at: now - 3,
    updated_at: now,
    finished_at: now,
  };
}

async function submitAddFriend(req: AddFriendReqExtended): Promise<AddFriendRespExtended> {
  if (USE_MOCK) {
    return mockSubmitAddFriend(req);
  }
  return addFriend(req as AddFriendReq) as Promise<AddFriendRespExtended>;
}

export async function addFriendWithTaskPoll(
  input: AddFriendSubmitInput,
  signal?: AbortSignal,
): Promise<{ resp: AddFriendRespExtended; characterId: string }> {
  const submitResp = await submitAddFriend(buildAddFriendReq(input));

  const result = await pollSubmitIfNeeded({
    submitResp,
    isAsync: isAsyncTaskSubmit,
    getTaskId: resp => resp.task_id!,
    toSyncResult: resp => resp,
    parseResult: json => JSON.parse(json) as AddFriendRespExtended,
    poll: USE_MOCK
      ? mockPollAddFriendTask
      : taskId => getTaskStatus({ task_id: taskId }),
    signal,
  });

  const characterId = resolveCharacterId(
    result,
    input.kind === 'character' ? input.characterId : undefined,
  );
  applyReFriendHandoff(characterId, result as AddFriendResp);
  return { resp: result, characterId };
}
