import { useCallback, useRef, useState } from 'react'

import { feedSearchApi } from '../api'
import { mapFeedPopopSearch } from '../mapper'
import type { FeedSearchType, SearchChatItem, SearchStoryItem } from '../types'

type UseFeedSearchResult = {
  stories: SearchStoryItem[]
  chats: SearchChatItem[]
  loading: Record<FeedSearchType, boolean>
  error: Record<FeedSearchType, boolean>
  searchedTypes: Record<FeedSearchType, boolean>
  searched: boolean
  search: (keyword: string, type?: FeedSearchType) => void
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

export function useFeedSearch(): UseFeedSearchResult {
  const [stories, setStories] = useState<SearchStoryItem[]>([])
  const [chats, setChats] = useState<SearchChatItem[]>([])
  const [loading, setLoading] = useState<Record<FeedSearchType, boolean>>(EMPTY_LOADING)
  const [error, setError] = useState<Record<FeedSearchType, boolean>>(EMPTY_ERROR)
  const [searchedTypes, setSearchedTypes] =
    useState<Record<FeedSearchType, boolean>>(EMPTY_SEARCHED_TYPES)
  const [searched, setSearched] = useState(false)
  const requestIdRef = useRef<Record<FeedSearchType, number>>({ post: 0, character: 0 })
  const keywordRef = useRef('')

  const search = useCallback((keyword: string, type: FeedSearchType = 'post') => {
    const kw = keyword.trim()
    if (!kw) return

    if (keywordRef.current !== kw) {
      keywordRef.current = kw
      requestIdRef.current.post += 1
      requestIdRef.current.character += 1
      setStories([])
      setChats([])
      setLoading(EMPTY_LOADING)
      setError(EMPTY_ERROR)
      setSearchedTypes(EMPTY_SEARCHED_TYPES)
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

  const reset = useCallback(() => {
    requestIdRef.current.post += 1
    requestIdRef.current.character += 1
    keywordRef.current = ''
    setStories([])
    setChats([])
    setLoading(EMPTY_LOADING)
    setError(EMPTY_ERROR)
    setSearchedTypes(EMPTY_SEARCHED_TYPES)
    setSearched(false)
  }, [])

  return { stories, chats, loading, error, searchedTypes, searched, search, reset }
}
