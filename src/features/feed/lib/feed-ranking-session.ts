import { FEED_CHARACTER_INSERT_COOLDOWN, FEED_PROMO_MIN_POSTS_INTERVAL } from './feed-layout-config'
import type { HomeFeedCharacter, HomeFeedPost } from '../feed-types'
import type { FeedLayoutItem } from './feed-layout-engine'

export type FeedRankingSession = {
  requestId: string
  requestIndex: number
  excludeIds: string[]
  postsSinceLastCharacterRow: number
  postsSinceGuarantee: number
  friendWindowPostCount: number
  friendWindowHasFriendPost: boolean
  friendPostRecall: HomeFeedPost[]
  exposedPostIds: Set<string>
  characterTagsById: Map<string, string[]>
  postsSinceLastPromo: number
  shownPromoIds: Set<string>
}

export function createFeedRankingSession(): FeedRankingSession {
  return {
    requestId: '',
    requestIndex: 0,
    excludeIds: [],
    postsSinceLastCharacterRow: FEED_CHARACTER_INSERT_COOLDOWN,
    postsSinceGuarantee: 0,
    friendWindowPostCount: 0,
    friendWindowHasFriendPost: false,
    friendPostRecall: [],
    exposedPostIds: new Set(),
    characterTagsById: new Map(),
    postsSinceLastPromo: FEED_PROMO_MIN_POSTS_INTERVAL,
    shownPromoIds: new Set(),
  }
}

let session = createFeedRankingSession()

export function getFeedRankingSession(): FeedRankingSession {
  return session
}

export function resetFeedRankingSession() {
  session = createFeedRankingSession()
}

export function rememberCharacterTags(characters: HomeFeedCharacter[]) {
  for (const character of characters) {
    if (!character.rawTags?.length) continue
    session.characterTagsById.set(character.characterId, character.rawTags)
  }
}

export function getCharacterTags(characterId: string): string[] {
  return session.characterTagsById.get(characterId) ?? []
}

export function resolveCharacterTags(characterId: string, items: FeedLayoutItem[] = []): string[] {
  const cached = getCharacterTags(characterId)
  if (cached.length) return cached

  for (const item of items) {
    if (item.kind !== 'character_row') continue
    const match = item.characters.find(character => character.characterId === characterId)
    if (match?.rawTags?.length) {
      rememberCharacterTags([match])
      return match.rawTags
    }
  }

  return []
}
