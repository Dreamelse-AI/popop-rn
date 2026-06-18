import { getCharacterDraftDetail, getCharacterDraftStatus } from '@/generated/arca_api'
import type { GetCharacterDraftStatusResp } from '@/generated/arca_apiComponents'
import { ApiError } from '@/shared/api/api-errors'

const DEFAULT_INTERVAL_MS = 1500
const DEFAULT_TIMEOUT_MS = 120_000

export class DraftStatusPollError extends Error {
  constructor(
    message: string,
    readonly rejectReason?: string,
  ) {
    super(message)
    this.name = 'DraftStatusPollError'
  }
}

export type PollDraftAuditStatusOptions = {
  draftId: string
  poll?: (draftId: string) => Promise<GetCharacterDraftStatusResp>
  fetchRejectReason?: (draftId: string) => Promise<string | undefined>
  intervalMs?: number
  timeoutMs?: number
  signal?: AbortSignal
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

function isDraftGoneError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 404 || /not found/i.test(error.message)
  }
  if (error instanceof Error) {
    return /not found/i.test(error.message)
  }
  return false
}

async function resolveRejectReason(
  draftId: string,
  fetchRejectReason?: (draftId: string) => Promise<string | undefined>,
): Promise<string | undefined> {
  if (fetchRejectReason) {
    return fetchRejectReason(draftId)
  }

  const resp = await getCharacterDraftDetail({ draft_id: draftId })
  return resp.draft?.reject_reason?.trim() || undefined
}

/** 轮询 `/character/draft_status`，直到审核通过（草稿消失）或拒绝 */
export async function pollDraftAuditStatus({
  draftId,
  poll = id => getCharacterDraftStatus({ draft_id: id }),
  fetchRejectReason,
  intervalMs = DEFAULT_INTERVAL_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  signal,
}: PollDraftAuditStatusOptions): Promise<void> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    try {
      const { status } = await poll(draftId)

      if (status === 'auditing') {
        await sleep(intervalMs, signal)
        continue
      }

      if (status === 'rejected') {
        const rejectReason = await resolveRejectReason(draftId, fetchRejectReason)
        throw new DraftStatusPollError(rejectReason || '审核未通过', rejectReason)
      }

      throw new DraftStatusPollError(`Unexpected draft status: ${status}`)
    } catch (error) {
      if (isDraftGoneError(error)) {
        return
      }
      throw error
    }
  }

  throw new DraftStatusPollError('Draft status polling timed out')
}
