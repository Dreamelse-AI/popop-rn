import { genAppearanceFromInput, getTaskStatus } from '@/generated/arca_api';
import type {
  GenAppearanceFromInputReq,
  GenAppearanceFromInputResp,
  GetTaskStatusResp,
} from '@/generated/arca_apiComponents';
import { randomUUID } from '@/shared/lib/random-uuid';
import { runPaidAction } from '@/shared/wallet';

import { MOCK_CREATION_LATENCY_MS, USE_CHARACTER_CREATION_MOCK } from '../config';
import { pollAsyncTask } from '../lib/poll-async-task';

export type GenerateAppearanceParams = {
  prompt: string;
  styleKey: string;
  referenceImageUrl?: string | null;
};

const MOCK_IMAGE_URL =
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=1200&fit=crop';

type MockTaskRecord = {
  createdAt: number;
  params: GenerateAppearanceParams;
};

const mockTasks = new Map<string, MockTaskRecord>();

async function mockSubmitAppearanceTask(
  params: GenerateAppearanceParams,
): Promise<{ task_id: string }> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_CREATION_LATENCY_MS);
  });

  const taskId = randomUUID();
  mockTasks.set(taskId, { createdAt: Date.now(), params });
  return { task_id: taskId };
}

async function mockGetTaskStatus(taskId: string): Promise<GetTaskStatusResp> {
  const record = mockTasks.get(taskId);
  if (!record) {
    throw new Error('Mock task not found');
  }

  const elapsed = Date.now() - record.createdAt;
  const now = Math.floor(Date.now() / 1000);

  if (elapsed < MOCK_CREATION_LATENCY_MS * 3) {
    return {
      task_id: taskId,
      task_type: 'gen_appearance',
      status: 'processing',
      created_at: now - 1,
      updated_at: now,
    };
  }

  const result: GenAppearanceFromInputResp = {
    image: {
      id: randomUUID(),
      url: MOCK_IMAGE_URL,
      media_type: 'image',
    },
    user_prompt: record.params.prompt,
    art_style_prompt: record.params.styleKey,
  };

  return {
    task_id: taskId,
    task_type: 'gen_appearance',
    status: 'ready',
    result: JSON.stringify(result),
    created_at: now - 3,
    updated_at: now,
    finished_at: now,
  };
}

function buildGenAppearanceRequest(params: GenerateAppearanceParams): GenAppearanceFromInputReq {
  const req: GenAppearanceFromInputReq = {
    scene: 'create_character',
  };

  const userPrompt = params.prompt.trim();
  const styleKey = params.styleKey.trim();

  if (userPrompt) req.description = userPrompt;
  if (styleKey) req.style_name = styleKey;

  return req;
}

/**
 * 提交 `/character/gen_appearance` 并轮询 `/task/get_status` 直到生成完成。
 * 余额不足时返回 null。
 */
export async function generateAppearanceImage(
  params: GenerateAppearanceParams,
  signal?: AbortSignal,
): Promise<GenAppearanceFromInputResp | null> {
  const submitResp = await runPaidAction(
    () =>
      USE_CHARACTER_CREATION_MOCK
        ? mockSubmitAppearanceTask(params)
        : genAppearanceFromInput(buildGenAppearanceRequest(params)),
    { source: 'gen_appearance' },
  );

  if (!submitResp?.task_id) return null;

  return pollAsyncTask({
    taskId: submitResp.task_id,
    signal,
    poll: USE_CHARACTER_CREATION_MOCK ? mockGetTaskStatus : (taskId) => getTaskStatus({ task_id: taskId }),
    parseResult: (json) => JSON.parse(json) as GenAppearanceFromInputResp,
  });
}
