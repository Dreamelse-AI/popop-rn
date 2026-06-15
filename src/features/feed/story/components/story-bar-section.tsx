import { forwardRef, useCallback, useImperativeHandle, useMemo } from 'react'

import { useFriendshipList } from '@/features/friendship/hooks/use-friendship-list'
import { useStoryReadStore } from '@/features/story/story-store'

import { sortStoryHeadlineItems } from '../headline-read'
import { useStoryHeadline } from '../use-story-headline'
import type { StoryBarSectionRef, StoryCharacterClickPayload } from '../types'
import { StoryBar } from './story-bar'
import { StoryBarEmpty } from './story-bar-empty'
import { StoryBarSkeleton } from './story-bar-skeleton'

type StoryBarSectionProps = {
  onCharacterClick: (payload: StoryCharacterClickPayload) => void
}

export const StoryBarSection = forwardRef<StoryBarSectionRef, StoryBarSectionProps>(
  function StoryBarSection({ onCharacterClick }, ref) {
    const { data, loading: headlineLoading, error, refresh: refreshHeadline } = useStoryHeadline()
    const {
      items: friends,
      loading: friendsLoading,
      refresh: refreshFriends,
    } = useFriendshipList(true)
    const readStoryIds = useStoryReadStore(s => s.readStoryIds)
    const fullyReadCharacterIds = useStoryReadStore(s => s.fullyReadCharacterIds)

    const refresh = useCallback(async () => {
      await Promise.all([refreshHeadline(), refreshFriends()])
    }, [refreshHeadline, refreshFriends])

    const sortedItems = useMemo(() => {
      if (!data?.items.length) return []
      const readSnapshot = {
        isStoryRead: (storyId: string) => readStoryIds.has(storyId),
        isCharacterFullyRead: (characterId: string) =>
          fullyReadCharacterIds.has(characterId),
      }
      return sortStoryHeadlineItems(data.items, readSnapshot)
    }, [data?.items, readStoryIds, fullyReadCharacterIds])

    useImperativeHandle(ref, () => ({ refresh }), [refresh])

    if (error) return null

    const waitingForFriends = friendsLoading && friends.length === 0
    const waitingForHeadline = headlineLoading && !data

    if (waitingForFriends || waitingForHeadline) {
      return <StoryBarSkeleton />
    }

    if (friends.length === 0) return null

    if (!data || data.state === 'empty' || data.items.length === 0) {
      return <StoryBarEmpty />
    }

    return (
      <StoryBar
        items={sortedItems}
        headlineState={data.state}
        onCharacterClick={onCharacterClick}
      />
    )
  },
)
