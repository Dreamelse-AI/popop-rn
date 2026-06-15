import { getTaskStatus } from '@/generated/arca_api';
import type { GetTaskStatusResp } from '@/generated/arca_apiComponents';

const DEFAULT_INTERVAL_MS = 1500;
const DEFAULT_TIMEOUT_MS = 120_000;

export class AsyncTaskPollError extends Error {
  constructor(
    message: string,
    readonly taskStatus?: GetTaskStatusResp,
  ) {
    super(message);
    this.name = 'AsyncTaskPollError';
  }
}

export type PollAsyncTaskOptions<T> = {
  taskId: string;
  parseResult: (resultJson: string) => T;
  poll?: (taskId: string) => Promise<GetTaskStatusResp>;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/** 轮询 `/task/get_status`，直到 ready / failed / 超时 */
export async function pollAsyncTask<T>({
  taskId,
  parseResult,
  poll = (id) => getTaskStatus({ task_id: id }),
  intervalMs = DEFAULT_INTERVAL_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  signal,
}: PollAsyncTaskOptions<T>): Promise<T> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const status = await poll(taskId);

    if (status.status === 'ready') {
      if (!status.result) {
        throw new AsyncTaskPollError('Task finished without result', status);
      }
      return parseResult(status.result);
    }

    if (status.status === 'failed') {
      throw new AsyncTaskPollError(status.error_message || 'Task failed', status);
    }

    await sleep(intervalMs, signal);
  }

  throw new AsyncTaskPollError('Task polling timed out');
}

export type PollSubmitIfNeededOptions<TSubmit, TResult> = {
  submitResp: TSubmit;
  isAsync: (resp: TSubmit) => boolean;
  getTaskId: (resp: TSubmit) => string;
  toSyncResult: (resp: TSubmit) => TResult;
  parseResult: (resultJson: string) => TResult;
  poll?: (taskId: string) => Promise<GetTaskStatusResp>;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
};

/** 提交接口若返回 task_id 则轮询，否则直接解析同步结果 */
export async function pollSubmitIfNeeded<TSubmit, TResult>({
  submitResp,
  isAsync,
  getTaskId,
  toSyncResult,
  parseResult,
  poll,
  intervalMs,
  timeoutMs,
  signal,
}: PollSubmitIfNeededOptions<TSubmit, TResult>): Promise<TResult> {
  if (isAsync(submitResp)) {
    return pollAsyncTask({
      taskId: getTaskId(submitResp),
      parseResult,
      poll,
      intervalMs,
      timeoutMs,
      signal,
    });
  }
  return toSyncResult(submitResp);
}
