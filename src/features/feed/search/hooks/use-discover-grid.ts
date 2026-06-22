/**
 * 搜索面板初始态「发现网格」Hook — POST /feed/popop_search（空 type / keyword）
 *
 * - enabled 为 true 时拉取一次（面板打开时）
 * - 支持分页加载更多
 * - 用 requestId 丢弃过期响应
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { feedSearchApi } from '../api'
import { mapDiscoverGrid } from '../mapper'
import type { DiscoverGridItem } from '../types'

type UseDiscoverGridResult = {
  items: DiscoverGridItem[]
  loading: boolean
  error: boolean
  hasMore: boolean
  loadingMore: boolean
  loadMore: () => void
}

export function useDiscoverGrid(enabled: boolean): UseDiscoverGridResult {
  const [items, setItems] = useState<DiscoverGridItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const requestIdRef = useRef(0)
  const cursorRef = useRef('')

  useEffect(() => {
    if (!enabled) return

    const requestId = ++requestIdRef.current
    cursorRef.current = ''
    setLoading(true)
    setError(false)

    void (async () => {
      try {
        const resp = await feedSearchApi.discover(21)
        if (requestId !== requestIdRef.current) return
        setItems(mapDiscoverGrid(resp))
        cursorRef.current = resp.next_cursor || ''
        setHasMore(Boolean(resp.next_cursor))
      } catch (e) {
        if (requestId !== requestIdRef.current) return
        console.error('[useDiscoverGrid] fetch failed:', e)
        setError(true)
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    })()
  }, [enabled])

  const loadMore = useCallback(() => {
    if (!cursorRef.current || loadingMore) return

    const requestId = ++requestIdRef.current
    setLoadingMore(true)

    void (async () => {
      try {
        const resp = await feedSearchApi.discover(21, cursorRef.current)
        if (requestId !== requestIdRef.current) return
        setItems(prev => [...prev, ...mapDiscoverGrid(resp)])
        cursorRef.current = resp.next_cursor || ''
        setHasMore(Boolean(resp.next_cursor))
      } catch (e) {
        if (requestId !== requestIdRef.current) return
        console.error('[useDiscoverGrid] loadMore failed:', e)
      } finally {
        if (requestId === requestIdRef.current) setLoadingMore(false)
      }
    })()
  }, [loadingMore])

  return { items, loading, error, hasMore, loadingMore, loadMore }
}
