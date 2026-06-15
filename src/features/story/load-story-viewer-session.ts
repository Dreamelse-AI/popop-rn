import type { StoryHeadline } from '@/features/feed/story/types'

import { storyApi } from './story-api'
import {
  mapStoryViewerToCharacter,
  type StoryViewerSession,
} from './story-viewer-mapper'

export async function loadStoryViewerSession(
  headlineItems: StoryHeadline[],
  clickedCharacterId: string,
): Promise<StoryViewerSession | null> {
  if (headlineItems.length === 0) return null

  const viewerResults = await Promise.all(
    headlineItems.map(async item => {
      try {
        const resp = await storyApi.getViewer({ character_id: item.characterId })
        const character = mapStoryViewerToCharacter(resp, item)
        return character ? { character, startIndex: resp.start_index } : null
      } catch (error) {
        console.warn('[story] viewer load failed:', item.characterId, error)
        return null
      }
    }),
  )

  const characters = viewerResults
    .map(r => r?.character)
    .filter((c): c is NonNullable<typeof c> => c != null)

  if (characters.length === 0) return null

  const initialCharacterIndex = characters.findIndex(c => c.id === clickedCharacterId)
  if (initialCharacterIndex < 0) return null

  const clickedResult = viewerResults.find(r => r?.character.id === clickedCharacterId)
  const initialStoryIndex = Math.max(0, clickedResult?.startIndex ?? 0)

  return { characters, initialCharacterIndex, initialStoryIndex }
}
