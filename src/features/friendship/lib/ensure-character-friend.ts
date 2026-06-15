import { friendshipApi } from '../api'
import { useFriendshipStore } from '../store/friendship-store'

export function isCharacterFriend(characterId: string): boolean {
  return useFriendshipStore
    .getState()
    .friends.some(friend => friend.character_id === characterId)
}

export async function ensureCharacterFriend(characterId: string): Promise<void> {
  if (!characterId) return
  if (isCharacterFriend(characterId)) return

  const { friends, loading, fetchList } = useFriendshipStore.getState()
  if (friends.length === 0 && !loading) {
    await fetchList({ force: true })
    if (isCharacterFriend(characterId)) return
  }

  await friendshipApi.addFriend(characterId)
  await useFriendshipStore.getState().fetchList({ force: true })
}
