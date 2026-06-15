import { useCallback, useEffect, useRef, useState } from 'react'

import { feedApi } from '../feed-api'
import type { HomeFeedCharacter, HomeFeedPost, HomeFeedResponse, FeedStreamItem } from '../feed-types'
import {
  getPendingInsert,
  peekPendingInserts,
  recordPostLiked,
  removePendingInsert,
  resetFeedInteractions,
  setPendingInsertCharacters,
} from '../lib/feed-interaction-store'
import {
  findCharacterRowAfterPost,
  replaceCharacterRowForPost,
  sanitizeAdjacentCharacterRows,
  type FeedLayoutItem,
} from '../lib/feed-layout-engine'
import {
  FEED_CHARACTER_INSERT_COOLDOWN,
  FEED_PAGE_SIZE,
} from '../lib/feed-layout-config'
import { getFeedRankingSession, resolveCharacterTags } from '../lib/feed-ranking-session'

export type FeedRefreshOutcome = 'success' | 'no_content' | 'error'

export type PostLikeState = {
  isLiked: boolean
  likeCount: number
}

export type PostLikedOptions = {
  deferInsert?: boolean
}

type UseFeedResult = {
  items: FeedLayoutItem[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  refresh: () => Promise<FeedRefreshOutcome>
  loadMore: () => Promise<void>
  syncPostLike: (postId: string, likeState: PostLikeState) => void
  onPostLiked: (post: HomeFeedPost, likeState: PostLikeState, options?: PostLikedOptions) => void
  onPostDetailClosed: (postId: string) => Promise<void>
}

function appendUniqueItems(existing: FeedLayoutItem[], incoming: FeedLayoutItem[]): FeedLayoutItem[] {
  const keys = new Set(existing.map(item => item.key))
  const unique = incoming.filter(item => !keys.has(item.key))
  return [...existing, ...unique]
}

function streamToLayoutItems(stream: FeedStreamItem[], characters: HomeFeedCharacter[]): FeedLayoutItem[] {
  const items: FeedLayoutItem[] = []

  for (const entry of stream) {
    if (entry.type === 'post') {
      items.push({ kind: 'post', key: `post-${entry.post.postId}`, post: entry.post })
    } else if (entry.type === 'promo') {
      items.push({ kind: 'promo', key: `promo-${entry.promo.promoId}`, promo: entry.promo })
    }
  }

  if (characters.length > 0) {
    items.push({
      kind: 'character_row',
      key: `character-row-${characters.map(c => c.characterId).join(',')}`,
      characters,
      reason: 'initial_hot',
    })
  }

  return items
}

export function useFeed(): UseFeedResult {
  const [items, setItems] = useState<FeedLayoutItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const requestIdRef = useRef(0)
  const initialLoadedRef = useRef(false)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const applyBatch = useCallback(
    (res: HomeFeedResponse, replace: boolean) => {
      const layoutItems = streamToLayoutItems(res.stream, res.characters)

      setItems(prev => {
        const merged = replace ? layoutItems : appendUniqueItems(prev, layoutItems)
        return sanitizeAdjacentCharacterRows(merged)
      })

      setHasMore(res.postCount >= FEED_PAGE_SIZE)
    },
    [],
  )

  const refresh = useCallback(async (): Promise<FeedRefreshOutcome> => {
    const requestId = ++requestIdRef.current
    setLoading(true)

    try {
      resetFeedInteractions()
      const res = await feedApi.refreshFeed()
      if (requestId !== requestIdRef.current) return 'success'

      if (!res.hasNewContent) {
        return 'no_content'
      }

      applyBatch(res, true)
      return 'success'
    } catch (e) {
      if (requestId !== requestIdRef.current) return 'error'
      console.error('[useFeed] refresh failed:', e)
      return 'error'
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [applyBatch])

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return

    const requestId = ++requestIdRef.current
    setLoadingMore(true)

    try {
      const res = await feedApi.loadMoreFeed()
      if (requestId !== requestIdRef.current) return
      if (!res.hasNewContent) {
        setHasMore(false)
        return
      }

      applyBatch(res, false)
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      console.error('[useFeed] load more failed:', e)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingMore(false)
      }
    }
  }, [applyBatch, hasMore, loading, loadingMore])

  const loadInitial = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)

    try {
      resetFeedInteractions()
      const res = await feedApi.getFeed()
      if (requestId !== requestIdRef.current) return
      if (res.hasNewContent) {
        applyBatch(res, true)
      }
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      console.error('[useFeed] initial load failed:', e)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [applyBatch])

  useEffect(() => {
    if (initialLoadedRef.current) return
    initialLoadedRef.current = true
    void loadInitial()
  }, [loadInitial])

  const syncPostLike = useCallback((postId: string, likeState: PostLikeState) => {
    setItems(prev =>
      prev.map(item =>
        item.kind === 'post' && item.post.postId === postId
          ? { ...item, post: { ...item.post, isLiked: likeState.isLiked, likeCount: likeState.likeCount } }
          : item,
      ),
    )
  }, [])

  const applyInteractionCharacterRow = useCallback((postId: string, rowCharacters: HomeFeedCharacter[]) => {
    if (!rowCharacters.length) return false

    const session = getFeedRankingSession()
    const existingRow = findCharacterRowAfterPost(itemsRef.current, postId)

    if (existingRow >= 0) {
      removePendingInsert(postId)
      setItems(prev => replaceCharacterRowForPost(prev, postId, rowCharacters))
      return true
    }

    if (session.postsSinceLastCharacterRow < FEED_CHARACTER_INSERT_COOLDOWN) {
      return false
    }

    session.postsSinceLastCharacterRow = 0
    removePendingInsert(postId)

    setItems(prev => {
      const postIndex = prev.findIndex(item => item.kind === 'post' && item.post.postId === postId)
      if (postIndex < 0) return prev

      const nextItem = prev[postIndex + 1]
      if (nextItem?.kind === 'character_row') return prev

      const rowItem: FeedLayoutItem = {
        kind: 'character_row',
        key: `character-row-interaction-${postId}`,
        characters: rowCharacters,
        anchorPostId: postId,
        reason: 'interaction',
      }

      const copy = [...prev]
      copy.splice(postIndex + 1, 0, rowItem)
      return sanitizeAdjacentCharacterRows(copy)
    })

    return true
  }, [])

  const fetchInteractionCharacters = useCallback(async (post: HomeFeedPost) => {
    const tags = resolveCharacterTags(post.characterId, itemsRef.current)
    if (!tags.length) return []

    const session = getFeedRankingSession()
    const characters = await feedApi.fetchInteractionCharacters(tags, session.excludeIds)
    return characters.slice(0, 5)
  }, [])

  const handlePostLiked = useCallback(
    async (post: HomeFeedPost, likeState: PostLikeState, options?: PostLikedOptions) => {
      syncPostLike(post.postId, likeState)
      if (!likeState.isLiked) return

      const tags = resolveCharacterTags(post.characterId, itemsRef.current)
      if (!tags.length) return

      recordPostLiked(post.postId, post.characterId, tags)

      try {
        const rowCharacters = await fetchInteractionCharacters(post)
        if (!rowCharacters.length) return

        setPendingInsertCharacters(post.postId, rowCharacters)

        if (!options?.deferInsert) {
          applyInteractionCharacterRow(post.postId, rowCharacters)
        }
      } catch (e) {
        console.error('[useFeed] fetch interaction characters failed:', e)
      }
    },
    [applyInteractionCharacterRow, fetchInteractionCharacters, syncPostLike],
  )

  const onPostLiked = useCallback(
    (post: HomeFeedPost, likeState: PostLikeState, options?: PostLikedOptions) => {
      void handlePostLiked(post, likeState, options)
    },
    [handlePostLiked],
  )

  const onPostDetailClosed = useCallback(async (postId: string) => {
    const pending = getPendingInsert(postId)
    if (!pending?.characters?.length) return
    applyInteractionCharacterRow(postId, pending.characters)
  }, [applyInteractionCharacterRow])

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    refresh,
    loadMore,
    syncPostLike,
    onPostLiked,
    onPostDetailClosed,
  }
}
