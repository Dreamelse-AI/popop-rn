import { useCallback, useEffect, useRef, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import type { UserPersonaItem } from '@/generated'

import { userPersonaApi } from '../api'
import { syncMeProfileFromPersona } from '../lib/me-profile-store'
import {
  PersonaAvatarAuditError,
  uploadPersonaAvatar,
} from '../lib/persona-avatar-upload'
import type { PersonaGender, UserPersonaForm } from '../types'

const EMPTY_FORM: UserPersonaForm = {
  personaId: null,
  name: '',
  gender: 'female',
  profile: '',
  avatarResourceId: '',
}

function toGender(value?: string): PersonaGender {
  if (value === 'male') return 'male'
  if (value === 'other') return 'other'
  return 'female'
}

function toForm(item: UserPersonaItem): UserPersonaForm {
  return {
    personaId: item.persona_id,
    name: item.name ?? '',
    gender: toGender(item.gender),
    profile: item.profile ?? '',
    avatarResourceId: item.avatar?.url ?? '',
  }
}

type UseUserPersonaResult = {
  form: UserPersonaForm
  loading: boolean
  saving: boolean
  error: boolean
  avatarUploading: boolean
  setForm: (updater: (prev: UserPersonaForm) => UserPersonaForm) => void
  pickAvatar: () => void
  save: () => Promise<{ ok: boolean; auditFailed?: boolean }>
}

export function useUserPersona(enabled: boolean): UseUserPersonaResult {
  const [form, setFormState] = useState<UserPersonaForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const loadedRef = useRef(false)
  const avatarUriRef = useRef<string | null>(null)

  const setForm = useCallback((updater: (prev: UserPersonaForm) => UserPersonaForm) => {
    setFormState(updater)
  }, [])

  const pickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri
    avatarUriRef.current = uri
    setFormState(prev => ({ ...prev, avatarResourceId: uri }))
  }, [])

  useEffect(() => {
    if (enabled) return
    avatarUriRef.current = null
  }, [enabled])

  useEffect(() => {
    if (!enabled || loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    setError(false)

    userPersonaApi
      .list()
      .then(resp => {
        const items = resp.items ?? []
        const picked = items.find(item => item.is_default) ?? items[0]
        if (picked) setFormState(toForm(picked))
      })
      .catch(e => {
        console.error('[useUserPersona] load failed:', e)
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [enabled])

  const save = useCallback(async (): Promise<{ ok: boolean; auditFailed?: boolean }> => {
    if (!form.name.trim()) return { ok: false }
    setSaving(true)
    try {
      let avatarUrl: string | undefined
      const avatarUri = avatarUriRef.current
      if (avatarUri) {
        setAvatarUploading(true)
        try {
          avatarUrl = await uploadPersonaAvatar(avatarUri)
        } finally {
          setAvatarUploading(false)
        }
      }

      if (form.personaId) {
        const resp = await userPersonaApi.update({
          persona_id: form.personaId,
          name: form.name.trim(),
          gender: form.gender,
          profile: form.profile,
          avatar_url: avatarUrl,
        })
        setFormState(toForm(resp.persona))
        syncMeProfileFromPersona(resp.persona)
      } else {
        const resp = await userPersonaApi.create({
          name: form.name.trim(),
          gender: form.gender,
          profile: form.profile,
          avatar_url: avatarUrl,
          is_default: true,
        })
        setFormState(toForm(resp.persona))
        syncMeProfileFromPersona(resp.persona)
      }

      avatarUriRef.current = null
      return { ok: true }
    } catch (e) {
      console.error('[useUserPersona] save failed:', e)
      if (e instanceof PersonaAvatarAuditError) {
        return { ok: false, auditFailed: true }
      }
      return { ok: false }
    } finally {
      setSaving(false)
    }
  }, [form])

  return { form, loading, saving, error, avatarUploading, setForm, pickAvatar, save }
}
