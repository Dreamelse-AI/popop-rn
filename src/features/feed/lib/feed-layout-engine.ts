import type { HomeFeedCharacter, HomeFeedPost, HomeFeedPromo } from '../feed-types'

export type CharacterRowReason = 'initial_hot' | 'interaction' | 'guarantee' | 'refreshed'

export type FeedLayoutItem =
  | { kind: 'post'; key: string; post: HomeFeedPost }
  | { kind: 'promo'; key: string; promo: HomeFeedPromo }
  | {
      kind: 'character_row'
      key: string
      characters: HomeFeedCharacter[]
      anchorPostId?: string
      reason: CharacterRowReason
    }

export function buildFeedBatch(_posts: HomeFeedPost[], _characters: HomeFeedCharacter[]): FeedLayoutItem[] {
  return []
}

export function findCharacterRowAfterPost(_items: FeedLayoutItem[], _postId: string): number {
  return -1
}

export function replaceCharacterRowForPost(
  _items: FeedLayoutItem[],
  _postId: string,
  _characters: HomeFeedCharacter[],
): FeedLayoutItem[] {
  return _items
}

export function sanitizeAdjacentCharacterRows(items: FeedLayoutItem[]): FeedLayoutItem[] {
  return items
}
