import { useCallback, useEffect, useState } from 'react'

import { hasAuthToken } from '@/features/auth/auth-store'
import type { UserPersonaItem } from '@/generated'

import { userPersonaApi } from '../api'
import { getAppliedPersonaId, setAppliedPersonaId } from '../lib/applied-persona-store'
import { resolveActivePersona } from '../lib/persona-utils'
import type { PersonaGender } from '../types'

type CreatePersonaInput = {
  name: string
  gender: PersonaGender
  profile: string
  avatarResourceId?: string
  isDefault?: boolean
}

type UpdatePersonaInput = {
  personaId: string
  name: string
  gender: PersonaGender
  profile: string
  avatarResourceId?: string
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
      const resp = await userPersonaApi.list()
      const nextItems = resp.items ?? []
      setItems(nextItems)
      return nextItems
    } catch (e) {
      console.error('[useUserPersonaList] load failed:', e)
      setError(true)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void refresh()
  }, [enabled, refresh])

  const getActivePersona = useCallback(() => {
    const appliedPersonaId = characterId ? getAppliedPersonaId(characterId) : null
    return resolveActivePersona(items, appliedPersonaId)
  }, [characterId, items])

  const applyToCharacter = useCallback(
    async (personaId: string) => {
      if (!characterId) return false
      try {
        await userPersonaApi.apply({
          character_id: characterId,
          persona_id: personaId,
        })
        setAppliedPersonaId(characterId, personaId)
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
        avatar_url: input.avatarResourceId,
        is_default: input.isDefault ?? false,
      })
      setItems(prev => {
        const next = resp.persona.is_default
          ? prev.map(item => ({ ...item, is_default: false }))
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
        avatar_url: input.avatarResourceId,
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
    applyToCharacter,
    createPersona,
    updatePersona,
    deletePersona,
  }
}
