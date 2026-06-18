import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuthStore } from '@/features/auth/auth-store'
import { useStoryReadStore } from '@/features/story/story-store'

import { storyApi } from './api'
import { mapStoryHeadlineList } from './mapper'
import type { StoryHeadlineList } from './types'

type UseStoryHeadlineResult = {
  data: StoryHeadlineList | null
  loading: boolean
  error: boolean
  refresh: () => Promise<void>
}

export function useStoryHeadline(enabled = true): UseStoryHeadlineResult {
  const [data, setData] = useState<StoryHeadlineList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const requestIdRef = useRef(0)

  const fetchHeadlineList = useCallback(async () => {
    if (!enabled || !useAuthStore.getState().token) return

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(false)

    try {
      const resp = await storyApi.getHeadlineList()
      if (requestId !== requestIdRef.current) return
      const mapped = mapStoryHeadlineList(resp)
      useStoryReadStore.getState().syncHeadlineReadStateFromServer(mapped.items)
      setData(mapped)
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      console.error('[useStoryHeadline] fetch failed:', e)
      setError(true)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void fetchHeadlineList()
  }, [enabled, fetchHeadlineList])

  return {
    data,
    loading,
    error,
    refresh: fetchHeadlineList,
  }
}
