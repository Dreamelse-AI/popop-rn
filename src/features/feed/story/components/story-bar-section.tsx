import { forwardRef, useCallback, useImperativeHandle, useMemo } from 'react'

import { useAuthStore } from '@/features/auth/auth-store'
import { useFriendshipList } from '@/features/friendship/hooks/use-friendship-list'
import { useStoryReadStore } from '@/features/story/story-store'

import { sortStoryHeadlineItems } from '../headline-read'
import { useStoryHeadline } from '../use-story-headline'
import type { StoryBarSectionRef, StoryCharacterClickPayload } from '../types'
import { StoryBar } from './story-bar'
import { StoryBarEmpty } from './story-bar-empty'
import { StoryBarSkeleton } from './story-bar-skeleton'
import {
  ENABLE_MOCK_MUSIC_STORIES,
  MOCK_MUSIC_STORY_HEADLINES,
} from '@/features/story/__mock__/mock-music-stories'

type StoryBarSectionProps = {
  onCharacterClick: (payload: StoryCharacterClickPayload) => void
}

export const StoryBarSection = forwardRef<StoryBarSectionRef, StoryBarSectionProps>(
  function StoryBarSection({ onCharacterClick }, ref) {
    const hasToken = useAuthStore(s => Boolean(s.token))
    const { data, loading: headlineLoading, error, refresh: refreshHeadline } = useStoryHeadline(hasToken)
    const {
      items: friends,
      loading: friendsLoading,
      refresh: refreshFriends,
    } = useFriendshipList(hasToken)
    const readStoryIds = useStoryReadStore(s => s.readStoryIds)
    const fullyReadCharacterIds = useStoryReadStore(s => s.fullyReadCharacterIds)

    const refresh = useCallback(async () => {
      await Promise.all([refreshHeadline(), refreshFriends()])
    }, [refreshHeadline, refreshFriends])

    const sortedItems = useMemo(() => {
      const readSnapshot = {
        isStoryRead: (storyId: string) => readStoryIds.has(storyId),
        isCharacterFullyRead: (characterId: string) =>
          fullyReadCharacterIds.has(characterId),
      }
      const real = data?.items.length
        ? sortStoryHeadlineItems(data.items, readSnapshot)
        : []
      // DEV：把带 BGM 的 mock 角色拼到头像栏最前面，方便直接点开测试
      return __DEV__ && ENABLE_MOCK_MUSIC_STORIES
        ? [...MOCK_MUSIC_STORY_HEADLINES, ...real]
        : real
    }, [data?.items, readStoryIds, fullyReadCharacterIds])

    useImperativeHandle(ref, () => ({ refresh }), [refresh])

    const mockEnabled = __DEV__ && ENABLE_MOCK_MUSIC_STORIES

    if (!mockEnabled && !hasToken) return null

    if (!mockEnabled && error) return null

    const waitingForFriends = friendsLoading && friends.length === 0
    const waitingForHeadline = headlineLoading && !data

    if (!mockEnabled && (waitingForFriends || waitingForHeadline)) {
      return <StoryBarSkeleton />
    }

    if (!mockEnabled && friends.length === 0) return null

    if (!mockEnabled && (!data || data.state === 'empty' || data.items.length === 0)) {
      return null
    }

    return (
      <StoryBar
        items={sortedItems}
        headlineState={data?.state ?? 'normal'}
        onCharacterClick={onCharacterClick}
      />
    )
  },
)
