/**
 * Feed 搜索 Hook
 *
 * - search(keyword, type)：显式触发（回车/点搜索按钮/切 tab），空串忽略
 * - loadMore(type)：滚动到底时加载下一页
 * - reset()：关闭面板时清空
 * - 按 post / character 分别丢弃过期响应，避免快速连续搜索时的竞态
 */
import { useCallback, useRef, useState } from 'react'

import { feedSearchApi } from '../api'
import { mapFeedPopopSearch } from '../mapper'
import type { FeedSearchType, SearchChatItem, SearchStoryItem } from '../types'

export type FeedSearchSnapshot = {
  keyword: string
  stories: SearchStoryItem[]
  chats: SearchChatItem[]
  searchedTypes: Record<FeedSearchType, boolean>
}

type UseFeedSearchResult = {
  stories: SearchStoryItem[]
  chats: SearchChatItem[]
  loading: Record<FeedSearchType, boolean>
  error: Record<FeedSearchType, boolean>
  searchedTypes: Record<FeedSearchType, boolean>
  searched: boolean
  hasMore: Record<FeedSearchType, boolean>
  loadingMore: Record<FeedSearchType, boolean>
  search: (keyword: string, type?: FeedSearchType) => void
  restore: (snapshot: FeedSearchSnapshot) => void
  loadMore: (type: FeedSearchType) => void
  reset: () => void
}

const EMPTY_LOADING: Record<FeedSearchType, boolean> = {
  post: false,
  character: false,
}

const EMPTY_ERROR: Record<FeedSearchType, boolean> = {
  post: false,
  character: false,
}

const EMPTY_SEARCHED_TYPES: Record<FeedSearchType, boolean> = {
  post: false,
  character: false,
}

const EMPTY_HAS_MORE: Record<FeedSearchType, boolean> = {
  post: false,
  character: false,
}

export function useFeedSearch(): UseFeedSearchResult {
  const [stories, setStories] = useState<SearchStoryItem[]>([])
  const [chats, setChats] = useState<SearchChatItem[]>([])
  const [loading, setLoading] = useState<Record<FeedSearchType, boolean>>(EMPTY_LOADING)
  const [loadingMore, setLoadingMore] = useState<Record<FeedSearchType, boolean>>(EMPTY_LOADING)
  const [error, setError] = useState<Record<FeedSearchType, boolean>>(EMPTY_ERROR)
  const [searchedTypes, setSearchedTypes] =
    useState<Record<FeedSearchType, boolean>>(EMPTY_SEARCHED_TYPES)
  const [searched, setSearched] = useState(false)
  const [hasMore, setHasMore] = useState<Record<FeedSearchType, boolean>>(EMPTY_HAS_MORE)
  const requestIdRef = useRef<Record<FeedSearchType, number>>({ post: 0, character: 0 })
  const keywordRef = useRef('')
  const cursorRef = useRef<Record<FeedSearchType, string>>({ post: '', character: '' })

  const search = useCallback((keyword: string, type: FeedSearchType = 'post') => {
    const kw = keyword.trim()
    if (!kw) return

    if (keywordRef.current !== kw) {
      keywordRef.current = kw
      requestIdRef.current.post += 1
      requestIdRef.current.character += 1
      cursorRef.current = { post: '', character: '' }
      setStories([])
      setChats([])
      setLoading(EMPTY_LOADING)
      setLoadingMore(EMPTY_LOADING)
      setError(EMPTY_ERROR)
      setSearchedTypes(EMPTY_SEARCHED_TYPES)
      setHasMore(EMPTY_HAS_MORE)
    } else if (searchedTypes[type] || loading[type]) {
      return
    }

    const requestId = ++requestIdRef.current[type]
    setLoading(prev => ({ ...prev, [type]: true }))
    setError(prev => ({ ...prev, [type]: false }))
    setSearched(true)

    void (async () => {
      try {
        const resp = await feedSearchApi.search(kw, type)
        if (requestId !== requestIdRef.current[type]) return
        const result = mapFeedPopopSearch(resp)
        if (type === 'post') {
          setStories(result.stories)
        } else {
          setChats(result.chats)
        }
        cursorRef.current[type] = resp.next_cursor || ''
        setHasMore(prev => ({ ...prev, [type]: Boolean(resp.next_cursor) }))
        setSearchedTypes(prev => ({ ...prev, [type]: true }))
      } catch (e) {
        if (requestId !== requestIdRef.current[type]) return
        console.error('[useFeedSearch] search failed:', e)
        setError(prev => ({ ...prev, [type]: true }))
        if (type === 'post') {
          setStories([])
        } else {
          setChats([])
        }
      } finally {
        if (requestId === requestIdRef.current[type]) {
          setLoading(prev => ({ ...prev, [type]: false }))
        }
      }
    })()
  }, [loading, searchedTypes])

  const restore = useCallback((snapshot: FeedSearchSnapshot) => {
    requestIdRef.current.post += 1
    requestIdRef.current.character += 1
    keywordRef.current = snapshot.keyword
    setStories(snapshot.stories)
    setChats(snapshot.chats)
    setLoading(EMPTY_LOADING)
    setError(EMPTY_ERROR)
    setSearchedTypes(snapshot.searchedTypes)
    setSearched(true)
  }, [])

  const loadMore = useCallback((type: FeedSearchType) => {
    const cursor = cursorRef.current[type]
    if (!cursor || loadingMore[type] || !keywordRef.current) return

    const requestId = ++requestIdRef.current[type]
    setLoadingMore(prev => ({ ...prev, [type]: true }))

    void (async () => {
      try {
        const resp = await feedSearchApi.search(keywordRef.current, type, 20, cursor)
        if (requestId !== requestIdRef.current[type]) return
        const result = mapFeedPopopSearch(resp)
        if (type === 'post') {
          setStories(prev => [...prev, ...result.stories])
        } else {
          setChats(prev => [...prev, ...result.chats])
        }
        cursorRef.current[type] = resp.next_cursor || ''
        setHasMore(prev => ({ ...prev, [type]: Boolean(resp.next_cursor) }))
      } catch (e) {
        if (requestId !== requestIdRef.current[type]) return
        console.error('[useFeedSearch] loadMore failed:', e)
      } finally {
        if (requestId === requestIdRef.current[type]) {
          setLoadingMore(prev => ({ ...prev, [type]: false }))
        }
      }
    })()
  }, [loadingMore])

  const reset = useCallback(() => {
    requestIdRef.current.post += 1
    requestIdRef.current.character += 1
    keywordRef.current = ''
    cursorRef.current = { post: '', character: '' }
    setStories([])
    setChats([])
    setLoading(EMPTY_LOADING)
    setLoadingMore(EMPTY_LOADING)
    setError(EMPTY_ERROR)
    setSearchedTypes(EMPTY_SEARCHED_TYPES)
    setSearched(false)
    setHasMore(EMPTY_HAS_MORE)
  }, [])

  return {
    stories,
    chats,
    loading,
    error,
    searchedTypes,
    searched,
    hasMore,
    loadingMore,
    search,
    restore,
    loadMore,
    reset,
  }
}
