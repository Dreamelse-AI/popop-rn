import { useCallback, useEffect, useRef, useState } from 'react'

import { feedApi } from '../feed-api'
import type { HomeFeedCharacter } from '../feed-types'
import {
  appendUniqueCharacters,
  buildSeedCharacterIds,
  RECOMMENDED_MORE_PAGE_SIZE,
} from '../lib/recommended-characters'

export function useRecommendedMore(featuredKey: string, featured: HomeFeedCharacter[]) {
  const [characters, setCharacters] = useState<HomeFeedCharacter[]>(featured)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(false)

  const sessionRef = useRef(0)
  const cursorRef = useRef<string | null>(null)
  const seedCharacterIdsRef = useRef<string[]>([])
  const charactersRef = useRef(characters)
  const featuredRef = useRef(featured)
  const loadingRef = useRef(loading)
  const loadingMoreRef = useRef(loadingMore)
  const hasMoreRef = useRef(hasMore)

  featuredRef.current = featured
  charactersRef.current = characters
  loadingRef.current = loading
  loadingMoreRef.current = loadingMore
  hasMoreRef.current = hasMore

  useEffect(() => {
    const session = ++sessionRef.current
    cursorRef.current = null
    const currentFeatured = featuredRef.current
    const seedCharacterIds = buildSeedCharacterIds(currentFeatured)
    seedCharacterIdsRef.current = seedCharacterIds

    setLoading(true)
    loadingRef.current = true
    setError(false)
    setHasMore(true)
    hasMoreRef.current = true
    setCharacters(currentFeatured)
    charactersRef.current = currentFeatured

    void (async () => {
      try {
        const { characters: more, hasMore: apiHasMore, nextCursor } = await feedApi.fetchRecommendedMore(
          seedCharacterIds,
          undefined,
          RECOMMENDED_MORE_PAGE_SIZE,
        )
        if (session !== sessionRef.current) return

        cursorRef.current = nextCursor
        const featuredIdSet = new Set(currentFeatured.map(character => character.characterId))
        const rest = more.filter(character => !featuredIdSet.has(character.characterId))
        const next = [...currentFeatured, ...rest]

        setCharacters(next)
        charactersRef.current = next
        setHasMore(apiHasMore)
        hasMoreRef.current = apiHasMore
      } catch (e) {
        if (session !== sessionRef.current) return
        console.error('[useRecommendedMore] initial fetch failed:', e)
        setError(true)
        setCharacters(currentFeatured)
        charactersRef.current = currentFeatured
        setHasMore(false)
        hasMoreRef.current = false
      } finally {
        if (session === sessionRef.current) {
          setLoading(false)
          loadingRef.current = false
        }
      }
    })()
  }, [featuredKey])

  const loadMore = useCallback(async () => {
    if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current) return

    loadingMoreRef.current = true
    setLoadingMore(true)
    setError(false)

    const session = sessionRef.current
    const cursor = cursorRef.current ?? undefined

    try {
      const { characters: more, hasMore: apiHasMore, nextCursor } = await feedApi.fetchRecommendedMore(
        seedCharacterIdsRef.current,
        cursor,
        RECOMMENDED_MORE_PAGE_SIZE,
      )
      if (session !== sessionRef.current) return

      cursorRef.current = nextCursor
      const next = appendUniqueCharacters(charactersRef.current, more)

      setCharacters(next)
      charactersRef.current = next

      const nextHasMore = apiHasMore
      setHasMore(nextHasMore)
      hasMoreRef.current = nextHasMore
    } catch (e) {
      if (session !== sessionRef.current) return
      console.error('[useRecommendedMore] load more failed:', e)
      setError(true)
    } finally {
      if (session === sessionRef.current) {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }
    }
  }, [])

  return { characters, loading, loadingMore, hasMore, error, loadMore }
}
