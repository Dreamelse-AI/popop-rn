import type { StoryHeadline } from '@/features/feed/story/types'

import { storyApi } from './story-api'
import {
  mapStoryViewerToCharacter,
  type StoryViewerSession,
} from './story-viewer-mapper'
import {
  ENABLE_MOCK_MUSIC_STORIES,
  MOCK_MUSIC_STORY_CHARACTERS,
} from './__mock__/mock-music-stories'

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

  const realCharacters = viewerResults
    .map(r => r?.character)
    .filter((c): c is NonNullable<typeof c> => c != null)

  // DEV：把带可播放 mp3 BGM 的 mock 角色拼到最前面，方便测试 BGM 加载/进度条联动/预加载
  const characters = __DEV__ && ENABLE_MOCK_MUSIC_STORIES
    ? [...MOCK_MUSIC_STORY_CHARACTERS, ...realCharacters]
    : realCharacters

  if (characters.length === 0) return null

  const useMock = __DEV__ && ENABLE_MOCK_MUSIC_STORIES
  const initialCharacterIndex = useMock
    ? 0
    : characters.findIndex(c => c.id === clickedCharacterId)
  if (initialCharacterIndex < 0) return null

  const clickedResult = viewerResults.find(r => r?.character.id === clickedCharacterId)
  const serverStartIndex = useMock ? 0 : (clickedResult?.startIndex ?? 0)
  const initialStoryIndex = serverStartIndex > 0 ? serverStartIndex : undefined

  return { characters, initialCharacterIndex, initialStoryIndex }
}
