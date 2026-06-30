import { useCallback, useEffect, useState } from 'react'

import { hasAuthToken } from '@/features/auth/auth-store'
import type { StorageObject } from '@/generated/arca_apiComponents'
import { resolveCharacterSaveId } from '@/features/chat/lib/resolve-character-save-id'
import type { UserPersonaItem } from '@/generated'

import { userPersonaApi } from '../api'
import { getAppliedPersonaId, setAppliedPersonaId } from '../lib/applied-persona-store'
import { resolveActivePersona, sortPersonasCurrentFirst } from '../lib/persona-utils'
import type { PersonaGender } from '../types'

type CreatePersonaInput = {
  name: string
  gender: PersonaGender
  profile: string
  avatarStorageObject?: StorageObject
  isDefault?: boolean
}

type UpdatePersonaInput = {
  personaId: string
  name: string
  gender: PersonaGender
  profile: string
  avatarStorageObject?: StorageObject
}

type UseUserPersonaListOptions = {
  enabled?: boolean
  characterId?: string
}

export function useUserPersonaList({ enabled = true, characterId }: UseUserPersonaListOptions = {}) {
  const [items, setItems] = useState<UserPersonaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    if (!hasAuthToken()) return []

    setLoading(true)
    setError(false)
    try {
      // 后端依据 character_save_id 计算 items[].is_current，缺省则全部为 false
      const characterSaveId = characterId
        ? await resolveCharacterSaveId(characterId).catch(() => undefined)
        : undefined
      const resp = await userPersonaApi.list(
        characterSaveId ? { character_save_id: characterSaveId } : {},
      )
      const nextItems = sortPersonasCurrentFirst(resp.items ?? [])
      setItems(nextItems)
      return nextItems
    } catch (e) {
      console.error('[useUserPersonaList] load failed:', e)
      setError(true)
      return []
    } finally {
      setLoading(false)
    }
  }, [characterId])

  useEffect(() => {
    if (!enabled) return
    void refresh()
  }, [enabled, refresh])

  const getActivePersona = useCallback(() => {
    const appliedPersonaId = characterId ? getAppliedPersonaId(characterId) : null
    return resolveActivePersona(items, appliedPersonaId)
  }, [characterId, items])

  const upsertPersona = useCallback((persona: UserPersonaItem) => {
    setItems(prev => {
      const exists = prev.some(item => item.persona_id === persona.persona_id)
      if (exists) {
        return prev.map(item =>
          item.persona_id === persona.persona_id
            ? { ...persona, is_current: item.is_current }
            : item,
        )
      }
      return [...prev, { ...persona, is_current: persona.is_current ?? false }]
    })
  }, [])

  const applyToCharacter = useCallback(
    async (personaId: string) => {
      if (!characterId) return false
      try {
        const characterSaveId = await resolveCharacterSaveId(characterId)
        await userPersonaApi.apply({
          character_save_id: characterSaveId,
          persona_id: personaId,
        })
        setAppliedPersonaId(characterId, personaId)
        setItems(prev =>
          prev.map(item => ({
            ...item,
            is_current: item.persona_id === personaId,
          })),
        )
        return true
      } catch (e) {
        console.error('[useUserPersonaList] apply failed:', e)
        return false
      }
    },
    [characterId],
  )

  const createPersona = useCallback(async (input: CreatePersonaInput) => {
    try {
      const resp = await userPersonaApi.create({
        name: input.name,
        gender: input.gender,
        profile: input.profile,
        avatar_url: input.avatarStorageObject,
      })
      setItems(prev => {
        const next = resp.persona.is_current
          ? prev.map(item => ({ ...item, is_current: false }))
          : prev
        return [...next, resp.persona]
      })
      return resp.persona
    } catch (e) {
      console.error('[useUserPersonaList] create failed:', e)
      return null
    }
  }, [])

  const updatePersona = useCallback(async (input: UpdatePersonaInput) => {
    try {
      const resp = await userPersonaApi.update({
        persona_id: input.personaId,
        name: input.name,
        gender: input.gender,
        profile: input.profile,
        avatar_url: input.avatarStorageObject,
      })
      setItems(prev => prev.map(item => (item.persona_id === resp.persona.persona_id ? resp.persona : item)))
      return resp.persona
    } catch (e) {
      console.error('[useUserPersonaList] update failed:', e)
      return null
    }
  }, [])

  const deletePersona = useCallback(async (personaId: string) => {
    try {
      const resp = await userPersonaApi.delete({ persona_id: personaId })
      if (!resp.deleted) return false
      setItems(prev => prev.filter(item => item.persona_id !== personaId))
      return true
    } catch (e) {
      console.error('[useUserPersonaList] delete failed:', e)
      return false
    }
  }, [])

  return {
    items,
    loading,
    error,
    refresh,
    getActivePersona,
    upsertPersona,
    applyToCharacter,
    createPersona,
    updatePersona,
    deletePersona,
  }
}
