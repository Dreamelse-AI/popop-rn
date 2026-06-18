import { genLandingPage, getTaskStatus } from '@/generated/arca_api'
import type { GenLandingPageReq, GenLandingPageResp } from '@/generated/arca_apiComponents'
import { runPaidAction } from '@/shared/wallet'

import { pollAsyncTask } from '../lib/poll-async-task'

function pollLandingPageTask(taskId: string, signal?: AbortSignal): Promise<GenLandingPageResp> {
  return pollAsyncTask({
    taskId,
    signal,
    poll: id => getTaskStatus({ task_id: id }),
    parseResult: json => JSON.parse(json) as GenLandingPageResp,
  })
}

/** 提交 `/character/gen_landing_page`；余额不足时返回 null */
export async function submitLandingPageGeneration(
  req: GenLandingPageReq,
): Promise<{ task_id: string } | null> {
  return runPaidAction(() => genLandingPage(req), { source: 'gen_landing_page' })
}

/** 轮询进行中的介绍页生成任务 */
export function resumeLandingPageGeneration(
  taskId: string,
  signal?: AbortSignal,
): Promise<GenLandingPageResp> {
  return pollLandingPageTask(taskId, signal)
}

export async function generateLandingPage(
  req: GenLandingPageReq,
  signal?: AbortSignal,
): Promise<GenLandingPageResp | null> {
  const submitResp = await submitLandingPageGeneration(req)
  if (!submitResp?.task_id) return null
  return pollLandingPageTask(submitResp.task_id, signal)
}
