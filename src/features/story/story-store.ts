import { create } from 'zustand'
import { storage } from '@/shared/storage'

const STORAGE_KEY = 'story_read_state'

type HeadlineUnreadItem = {
  characterId: string
  unread: boolean
}

type StoryReadState = {
  readStoryIds: Set<string>
  fullyReadCharacterIds: Set<string>
  lastReadStoryPerCharacter: Map<string, string>
  markStoryRead: (storyId: string) => void
  markCharacterFullyRead: (characterId: string) => void
  setLastReadStory: (characterId: string, storyId: string) => void
  getLastReadStory: (characterId: string) => string | undefined
  isStoryRead: (storyId: string) => boolean
  isCharacterFullyRead: (characterId: string) => boolean
  /** headline 拉取后：服务端 unread=true 时清除过期的 fullyRead 本地标记 */
  syncHeadlineReadStateFromServer: (items: HeadlineUnreadItem[]) => void
}

export const useStoryReadStore = create<StoryReadState>((set, get) => ({
  readStoryIds: new Set(loadReadIds().storyIds),
  fullyReadCharacterIds: new Set(loadReadIds().characterIds),
  lastReadStoryPerCharacter: new Map(loadReadIds().lastReadPerChar),

  markStoryRead: (storyId: string) => {
    set(state => {
      const next = new Set(state.readStoryIds)
      next.add(storyId)
      saveReadIds(next, state.fullyReadCharacterIds, state.lastReadStoryPerCharacter)
      return { readStoryIds: next }
    })
  },

  markCharacterFullyRead: (characterId: string) => {
    set(state => {
      if (state.fullyReadCharacterIds.has(characterId)) return state
      const next = new Set(state.fullyReadCharacterIds)
      next.add(characterId)
      saveReadIds(state.readStoryIds, next, state.lastReadStoryPerCharacter)
      return { fullyReadCharacterIds: next }
    })
  },

  setLastReadStory: (characterId: string, storyId: string) => {
    set(state => {
      const next = new Map(state.lastReadStoryPerCharacter)
      next.set(characterId, storyId)
      saveReadIds(state.readStoryIds, state.fullyReadCharacterIds, next)
      return { lastReadStoryPerCharacter: next }
    })
  },

  getLastReadStory: (characterId: string) => {
    return get().lastReadStoryPerCharacter.get(characterId)
  },

  isStoryRead: (storyId: string) => get().readStoryIds.has(storyId),

  isCharacterFullyRead: (characterId: string) =>
    get().fullyReadCharacterIds.has(characterId),

  syncHeadlineReadStateFromServer: (items: HeadlineUnreadItem[]) => {
    const unreadCharacterIds = items.filter(item => item.unread).map(item => item.characterId)
    if (unreadCharacterIds.length === 0) return

    set(state => {
      const next = new Set(state.fullyReadCharacterIds)
      let changed = false
      for (const characterId of unreadCharacterIds) {
        if (next.delete(characterId)) changed = true
      }
      if (!changed) return state
      saveReadIds(state.readStoryIds, next, state.lastReadStoryPerCharacter)
      return { fullyReadCharacterIds: next }
    })
  },
}))

function loadReadIds(): {
  storyIds: string[]
  characterIds: string[]
  lastReadPerChar: [string, string][]
} {
  try {
    const raw = storage.get(STORAGE_KEY)
    if (!raw) return { storyIds: [], characterIds: [], lastReadPerChar: [] }
    const data = JSON.parse(raw)
    return {
      storyIds: data.storyIds ?? [],
      characterIds: data.characterIds ?? [],
      lastReadPerChar: data.lastReadPerChar ?? [],
    }
  } catch {
    return { storyIds: [], characterIds: [], lastReadPerChar: [] }
  }
}

function saveReadIds(
  storyIds: Set<string>,
  characterIds: Set<string>,
  lastReadPerChar: Map<string, string>,
) {
  storage.set(
    STORAGE_KEY,
    JSON.stringify({
      storyIds: [...storyIds],
      characterIds: [...characterIds],
      lastReadPerChar: [...lastReadPerChar],
    }),
  )
}
