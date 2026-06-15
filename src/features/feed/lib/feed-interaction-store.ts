import type { HomeFeedCharacter } from '../feed-types'
import { getCharacterTags } from './feed-ranking-session'

export type PendingCharacterInsert = {
  afterPostId: string
  characterId: string
  tags: string[]
  replaceExisting: boolean
  characters?: HomeFeedCharacter[]
}

type FeedInteractionState = {
  likedPostIds: Set<string>
  messagedCharacterIds: Set<string>
  pendingInserts: PendingCharacterInsert[]
}

const state: FeedInteractionState = {
  likedPostIds: new Set(),
  messagedCharacterIds: new Set(),
  pendingInserts: [],
}

export function resetFeedInteractions() {
  state.likedPostIds.clear()
  state.messagedCharacterIds.clear()
  state.pendingInserts = []
}

export function recordPostLiked(postId: string, characterId: string, tags?: string[]) {
  if (state.likedPostIds.has(postId)) return
  state.likedPostIds.add(postId)
  queueCharacterInsert(postId, characterId, true, tags)
}

export function recordFirstMessageToCharacter(characterId: string, anchorPostId?: string) {
  if (state.messagedCharacterIds.has(characterId)) return
  state.messagedCharacterIds.add(characterId)
  if (!anchorPostId) return
  queueCharacterInsert(anchorPostId, characterId, true)
}

function queueCharacterInsert(
  afterPostId: string,
  characterId: string,
  replaceExisting: boolean,
  tags?: string[],
) {
  const resolvedTags = tags?.length ? tags : getCharacterTags(characterId)
  const existing = state.pendingInserts.find(item => item.afterPostId === afterPostId)
  if (existing) {
    existing.tags = resolvedTags
    existing.replaceExisting = replaceExisting
    return
  }
  state.pendingInserts.push({
    afterPostId,
    characterId,
    tags: resolvedTags,
    replaceExisting,
  })
}

export function setPendingInsertCharacters(afterPostId: string, characters: HomeFeedCharacter[]) {
  const existing = state.pendingInserts.find(item => item.afterPostId === afterPostId)
  if (existing) {
    existing.characters = characters
    return
  }
  state.pendingInserts.push({
    afterPostId,
    characterId: '',
    tags: [],
    replaceExisting: true,
    characters,
  })
}

export function getPendingInsert(afterPostId: string): PendingCharacterInsert | undefined {
  return state.pendingInserts.find(item => item.afterPostId === afterPostId)
}

export function consumePendingInserts(): PendingCharacterInsert[] {
  const items = [...state.pendingInserts]
  state.pendingInserts = []
  return items
}

export function peekPendingInserts(): PendingCharacterInsert[] {
  return [...state.pendingInserts]
}

export function removePendingInsert(afterPostId: string) {
  state.pendingInserts = state.pendingInserts.filter(item => item.afterPostId !== afterPostId)
}
