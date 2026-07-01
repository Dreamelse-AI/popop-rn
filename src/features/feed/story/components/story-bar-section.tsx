import { forwardRef, useCallback, useImperativeHandle, useMemo } from 'react'

import { useAuthStore } from '@/features/auth/auth-store'
import { useFriendshipList } from '@/features/friendship/hooks/use-friendship-list'

import { sortStoryHeadlineItems } from '../headline-read'
import { useStoryHeadline } from '../use-story-headline'
import type { StoryBarSectionRef, StoryCharacterClickPayload } from '../types'
import { StoryBar } from './story-bar'
import { StoryBarSkeleton } from './story-bar-skeleton'

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

    const refresh = useCallback(async () => {
      await Promise.all([refreshHeadline(), refreshFriends()])
    }, [refreshHeadline, refreshFriends])

    const sortedItems = useMemo(() => {
      return data?.items.length ? sortStoryHeadlineItems(data.items) : []
    }, [data?.items])

    useImperativeHandle(ref, () => ({ refresh }), [refresh])

    if (!hasToken) return null

    if (error) return null

    const waitingForFriends = friendsLoading && friends.length === 0
    const waitingForHeadline = headlineLoading && !data

    if (waitingForFriends || waitingForHeadline) {
      return <StoryBarSkeleton />
    }

    if (friends.length === 0) return null

    if (!data || data.state === 'empty' || data.items.length === 0) {
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
