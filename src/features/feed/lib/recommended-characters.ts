import { type HomeFeedCharacter } from '../feed-types';

export const FEED_RECOMMENDED_PREVIEW_LIMIT: number = 5;

export const RECOMMENDED_MORE_PAGE_SIZE: number = 20;

export type RecommendedMoreLocationState = {
  featuredCharacters: HomeFeedCharacter[];
};

export function buildSeedCharacterIds(characters: HomeFeedCharacter[]): string[] {
  return characters.map(character => character.characterId);
}

export function appendUniqueCharacters(
  existing: HomeFeedCharacter[],
  incoming: HomeFeedCharacter[],
): HomeFeedCharacter[] {
  const ids = new Set(existing.map(character => character.characterId));
  const unique = incoming.filter(character => !ids.has(character.characterId));
  return unique.length > 0 ? [...existing, ...unique] : existing;
}

const GRID_ROW_HEIGHTS = [328, 344] as const;

export function buildRecommendedGridRows(characters: HomeFeedCharacter[]): { height: number; items: HomeFeedCharacter[] }[] {
  const rows: { height: number; items: HomeFeedCharacter[] }[] = [];

  for (let index = 0; index < characters.length; index += 2) {
    const rowIndex = Math.floor(index / 2);
    rows.push({
      height: GRID_ROW_HEIGHTS[rowIndex % GRID_ROW_HEIGHTS.length] ?? 328,
      items: characters.slice(index, index + 2),
    });
  }

  return rows;
}

export function shouldUseBadgeBlur(rowIndex: number, columnIndex: number): boolean {
  return rowIndex % 2 === 0 && columnIndex === 1;
}
