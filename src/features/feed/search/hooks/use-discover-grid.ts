import { useEffect, useRef, useState } from 'react'

import { feedSearchApi } from '../api'
import { mapDiscoverGrid } from '../mapper'
import type { DiscoverGridItem } from '../types'

type UseDiscoverGridResult = {
  items: DiscoverGridItem[]
  loading: boolean
  error: boolean
}

export function useDiscoverGrid(enabled: boolean): UseDiscoverGridResult {
  const [items, setItems] = useState<DiscoverGridItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(false)

    void (async () => {
      try {
        const resp = await feedSearchApi.discover()
        if (requestId !== requestIdRef.current) return
        setItems(mapDiscoverGrid(resp))
      } catch (e) {
        if (requestId !== requestIdRef.current) return
        console.error('[useDiscoverGrid] fetch failed:', e)
        setError(true)
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    })()
  }, [enabled])

  return { items, loading, error }
}
