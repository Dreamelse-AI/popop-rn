import reactotron from './reactotron'

type ApiReactotronPayload = {
  method: string
  path: string
  url: string
  status: number
  request: {
    body?: unknown
    headers: Record<string, string>
  }
  response: unknown
  error?: string
  durationMs?: number
}

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted = { ...headers }
  if (redacted.Authorization) redacted.Authorization = 'Bearer ***'
  if (redacted['X-Sign']) redacted['X-Sign'] = '***'
  return redacted
}

export function trackApiCall(payload: ApiReactotronPayload): void {
  const request = {
    url: payload.url,
    method: payload.method,
    data: payload.request.body != null ? JSON.stringify(payload.request.body) : undefined,
    headers: redactHeaders(payload.request.headers),
    params: undefined as Record<string, string> | undefined,
  }

  const responseBody = payload.error
    ? JSON.stringify({
        error: payload.error,
        ...(payload.response != null ? { body: payload.response } : {}),
      })
    : JSON.stringify(payload.response)

  const response = {
    body: responseBody,
    status: payload.status,
    headers: {} as Record<string, string>,
  }

  reactotron.apiResponse(request, response, payload.durationMs ?? 0)
}
