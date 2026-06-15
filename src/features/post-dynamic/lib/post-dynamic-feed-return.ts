import { sessionStore } from '@/shared/session-store'

const KEY = 'arca:post-dynamic-publish-success'

export function markPostDynamicPublishSuccess() {
  sessionStore.set(KEY, '1')
}

export function takePostDynamicPublishSuccess(): boolean {
  const value = sessionStore.get(KEY)
  if (value) sessionStore.remove(KEY)
  return value === '1'
}
