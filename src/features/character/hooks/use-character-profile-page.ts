import { useCallback, useEffect, useRef, useState } from 'react'

import { countCharacterPostImages, mapCharacterPosts, type CharacterPostView } from '@/features/post/post-mapper'
import { storyApi } from '@/features/story/story-api'
import { dedupeRequest } from '@/shared/api/dedupe-request'

import { characterApi } from '../api'
import { getCharacterProfile } from '@/pages/character/mock-data'

import {
  getMockCharacterProfilePosts,
  shouldUseMockCharacterPosts,
} from '../mock/character-profile-posts.mock'
import { mapCharacterProfile, mapPostsToProfileGridCells } from '../mapper'
import type { CharacterProfileData, CharacterProfileGridCell } from '../types'

function mapMockProfile(characterId: string): CharacterProfileData | null {
  const mock = getCharacterProfile(characterId)
  if (!mock) return null

  return {
    id: mock.id,
    name: mock.name,
    avatar: mock.avatar,
    heroImage: mock.heroImage,
    heroImageOverlay: mock.heroImageOverlay,
    tags: mock.tags,
    chatCount: mock.chatCount,
  }
}

function applyMockPosts(characterId: string) {
  const rawPosts = getMockCharacterProfilePosts(characterId)
  const mappedPosts = mapCharacterPosts(rawPosts)

  return {
    rawPosts,
    mappedPosts,
    imageCount: countCharacterPostImages(rawPosts),
  }
}

const PAGE_SIZE = 30

type UseCharacterProfilePageResult = {
  profile: CharacterProfileData | null
  cells: CharacterProfileGridCell[]
  posts: CharacterPostView[]
  imageCount: number
  loading: boolean
  postsLoading: boolean
  loadingMore: boolean
  error: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useCharacterProfilePage(characterId: string): UseCharacterProfilePageResult {
  const [profile, setProfile] = useState<CharacterProfileData | null>(null)
  const [cells, setCells] = useState<CharacterProfileGridCell[]>([])
  const [posts, setPosts] = useState<CharacterPostView[]>([])
  const [imageCount, setImageCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [postsLoading, setPostsLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const cursorRef = useRef<string | undefined>(undefined)
  const loadMoreRequestIdRef = useRef(0)
  const initialLoadIdRef = useRef(0)

  const loadInitial = useCallback(async () => {
    if (!characterId) return

    const loadId = ++initialLoadIdRef.current
    setLoading(true)
    setPostsLoading(true)
    setError(false)
    cursorRef.current = undefined

    const useMockPosts = shouldUseMockCharacterPosts()

    try {
      let detailResp: Awaited<ReturnType<typeof characterApi.getDetail>> | null = null
      let postsResp: Awaited<ReturnType<typeof storyApi.listCharacterPosts>> | null = null

      if (useMockPosts) {
        try {
          detailResp = await characterApi.getDetail({
            character_id: characterId,
            source: 'character_page',
          })
        } catch (detailError) {
          console.warn('[useCharacterProfilePage] detail API failed in mock mode:', detailError)
        }
      } else {
        const result = await dedupeRequest(
          `character-profile-page:${characterId}`,
          async () => {
            const [detail, posts] = await Promise.all([
              characterApi.getDetail({
                character_id: characterId,
                source: 'character_page',
              }),
              storyApi.listCharacterPosts({
                character_id: characterId,
                limit: PAGE_SIZE,
              }),
            ])
            return { detailResp: detail, postsResp: posts }
          },
        )
        detailResp = result.detailResp
        postsResp = result.postsResp
      }

      if (loadId !== initialLoadIdRef.current) return

      const mappedProfile =
        (detailResp ? mapCharacterProfile(detailResp.character) : null) ??
        (useMockPosts ? mapMockProfile(characterId) : null)

      if (!mappedProfile) {
        setError(true)
        setProfile(null)
        setCells([])
        setPosts([])
        setImageCount(0)
        setHasMore(false)
        return
      }

      setProfile(mappedProfile)

      if (useMockPosts) {
        const { rawPosts, mappedPosts, imageCount: mockImageCount } = applyMockPosts(characterId)
        setPosts(mappedPosts)
        setCells(mapPostsToProfileGridCells(rawPosts))
        setImageCount(mockImageCount)
        cursorRef.current = undefined
        setHasMore(false)
      } else {
        const rawPosts = postsResp?.posts ?? []
        const mappedPosts = mapCharacterPosts(rawPosts)
        setPosts(mappedPosts)
        setCells(mapPostsToProfileGridCells(rawPosts))
        setImageCount(countCharacterPostImages(rawPosts))
        cursorRef.current = postsResp?.next_cursor || undefined
        setHasMore(Boolean(postsResp?.has_more && postsResp?.next_cursor))
      }
    } catch (e) {
      if (loadId !== initialLoadIdRef.current) return

      if (useMockPosts) {
        const mappedProfile = mapMockProfile(characterId)
        if (!mappedProfile) {
          console.error('[useCharacterProfilePage] mock fallback failed:', e)
          setError(true)
          setProfile(null)
          setCells([])
          setPosts([])
          setImageCount(0)
          setHasMore(false)
          return
        }

        console.warn('[useCharacterProfilePage] using mock fallback after load failed:', e)
        setProfile(mappedProfile)
        const { rawPosts, mappedPosts, imageCount: mockImageCount } = applyMockPosts(characterId)
        setPosts(mappedPosts)
        setCells(mapPostsToProfileGridCells(rawPosts))
        setImageCount(mockImageCount)
        cursorRef.current = undefined
        setHasMore(false)
        return
      }

      console.error('[useCharacterProfilePage] load failed:', e)
      setError(true)
      setProfile(null)
      setCells([])
      setPosts([])
      setImageCount(0)
      setHasMore(false)
    } finally {
      if (loadId === initialLoadIdRef.current) {
        setLoading(false)
        setPostsLoading(false)
      }
    }
  }, [characterId])

  const loadMore = useCallback(async () => {
    if (shouldUseMockCharacterPosts()) return
    if (!characterId || !hasMore || loading || postsLoading || loadingMore) return

    const requestId = ++loadMoreRequestIdRef.current
    setLoadingMore(true)

    try {
      const resp = await storyApi.listCharacterPosts({
        character_id: characterId,
        limit: PAGE_SIZE,
        ...(cursorRef.current ? { cursor: cursorRef.current } : {}),
      })
      if (requestId !== loadMoreRequestIdRef.current) return

      const nextPosts = resp.posts ?? []
      const mappedPosts = mapCharacterPosts(nextPosts)
      setPosts(prev => [...prev, ...mappedPosts])
      setCells(prev => [...prev, ...mapPostsToProfileGridCells(nextPosts)])
      setImageCount(prev => prev + countCharacterPostImages(nextPosts))
      cursorRef.current = resp.next_cursor || undefined
      setHasMore(Boolean(resp.has_more && resp.next_cursor))
    } catch (e) {
      if (requestId !== loadMoreRequestIdRef.current) return
      console.error('[useCharacterProfilePage] loadMore failed:', e)
    } finally {
      if (requestId === loadMoreRequestIdRef.current) {
        setLoadingMore(false)
      }
    }
  }, [characterId, hasMore, loading, loadingMore, postsLoading])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  return {
    profile,
    cells,
    posts,
    imageCount,
    loading,
    postsLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh: loadInitial,
  }
}
