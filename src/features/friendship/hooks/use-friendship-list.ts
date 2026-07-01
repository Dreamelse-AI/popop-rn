import { useCallback, useEffect, useMemo } from 'react'

import type { CharacterListItem, MessageConversation, MessageScene } from '@/pages/home/messages/types'
import type { PinnedCharacterItem } from '@/pages/home/messages/messages-pinned-row'

import {
  mapFriendshipToCharacterListItem,
  mapFriendshipToConversation,
  mapFriendshipToMessageScene,
  mapFriendshipToPinnedCharacter,
} from '../mapper'
import { useFriendshipStore } from '../store/friendship-store'

type UseFriendshipListResult = {
  items: CharacterListItem[]
  conversations: MessageConversation[]
  /** 置顶角色（来自 POST /friendship/list_pinned，无分页） */
  pinnedItems: PinnedCharacterItem[]
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
  const pinnedFriends = useFriendshipStore(s => s.pinnedFriends)
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

  const pinnedIds = useMemo(
    () => new Set(pinnedFriends.map(item => item.character_id)),
    [pinnedFriends],
  )
  const items = useMemo(
    () =>
      friends.map(friend =>
        mapFriendshipToCharacterListItem(friend, pinnedIds.has(friend.character_id)),
      ),
    [friends, pinnedIds],
  )
  const conversations = useMemo(() => friends.map(mapFriendshipToConversation), [friends])
  const pinnedItems = useMemo(
    () => pinnedFriends.map(mapFriendshipToPinnedCharacter),
    [pinnedFriends],
  )
  const scene = useMemo(() => mapFriendshipToMessageScene(friends), [friends])

  const refresh = useCallback(async () => {
    await useFriendshipStore.getState().fetchList({ force: true })
  }, [])

  return {
    items,
    conversations,
    pinnedItems,
    scene,
    loading,
    error,
    refresh,
    pinFriend,
    unpinFriend,
    removeFriends,
  }
}
