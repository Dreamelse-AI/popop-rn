import { useFriendshipStore } from '@/features/friendship/store/friendship-store'

import { pendingCharacterSaveId } from './chat-model-session-store'

function getCharacterSaveIdFromStore(characterId: string): string | null {
  const friend = useFriendshipStore
    .getState()
    .friends.find(item => item.character_id === characterId)
  const saveId = friend?.current_character_save_id?.trim()
  if (!saveId || saveId === pendingCharacterSaveId(characterId)) return null
  return saveId
}

/** 解析角色存档 ID：从好友列表读取真实 save_id，必要时刷新列表 */
export async function resolveCharacterSaveId(characterId: string): Promise<string> {
  const cachedSaveId = getCharacterSaveIdFromStore(characterId)
  if (cachedSaveId) return cachedSaveId

  await useFriendshipStore.getState().fetchList({ force: true })

  const refreshedSaveId = getCharacterSaveIdFromStore(characterId)
  if (refreshedSaveId) return refreshedSaveId

  throw new Error(`Missing character_save_id for character ${characterId}`)
}
