import { useCallback, useEffect, useMemo } from 'react'

import type { CharacterListItem, MessageConversation, MessageScene } from '@/pages/home/messages/types'

import {
  mapFriendshipToCharacterListItem,
  mapFriendshipToConversation,
  mapFriendshipToMessageScene,
} from '../mapper'
import { useFriendshipStore } from '../store/friendship-store'

type UseFriendshipListResult = {
  items: CharacterListItem[]
  conversations: MessageConversation[]
  scene: MessageScene
  loading: boolean
  error: boolean
  refresh: () => Promise<void>
  pinFriend: (characterId: string) => Promise<void>
  unpinFriend: (characterId: string) => Promise<void>
  removeFriends: (characterIds: string[]) => Promise<void>
}

export function useFriendshipList(enabled: boolean): UseFriendshipListResult {
  const friends = useFriendshipStore(s => s.friends)
  const loading = useFriendshipStore(s => s.loading)
  const error = useFriendshipStore(s => s.error)
  const fetchList = useFriendshipStore(s => s.fetchList)
  const pinFriend = useFriendshipStore(s => s.pinFriend)
  const unpinFriend = useFriendshipStore(s => s.unpinFriend)
  const removeFriends = useFriendshipStore(s => s.removeFriends)

  useEffect(() => {
    if (!enabled) return
    void fetchList()
  }, [enabled, fetchList])

  const items = useMemo(() => friends.map(mapFriendshipToCharacterListItem), [friends])
  const conversations = useMemo(() => friends.map(mapFriendshipToConversation), [friends])
  const scene = useMemo(() => mapFriendshipToMessageScene(friends), [friends])

  const refresh = useCallback(async () => {
    await useFriendshipStore.getState().fetchList({ force: true })
  }, [])

  return {
    items,
    conversations,
    scene,
    loading,
    error,
    refresh,
    pinFriend,
    unpinFriend,
    removeFriends,
  }
}
