import { useCallback, useEffect, useRef, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import type { StorageObject } from '@/generated/arca_apiComponents'
import type { UserPersonaItem } from '@/generated'

import { userPersonaApi } from '../api'
import { syncMeProfileFromPersona } from '../lib/me-profile-store'
import {
  PersonaAvatarAuditError,
  uploadPersonaAvatar,
} from '../lib/persona-avatar-upload'
import { normalizePersonaName } from '../lib/persona-utils'
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

type UseUserPersonaOptions = {
  /** undefined = 默认自设；null = 新建；string = 编辑指定自设 */
  personaId?: string | null
  isDefaultOnCreate?: boolean
}

type UseUserPersonaResult = {
  form: UserPersonaForm
  loading: boolean
  saving: boolean
  error: boolean
  avatarUploading: boolean
  setForm: (updater: (prev: UserPersonaForm) => UserPersonaForm) => void
  pickAvatar: () => void
  save: () => Promise<{ ok: boolean; auditFailed?: boolean; personaId?: string; persona?: UserPersonaItem }>
}

export function useUserPersona(
  enabled: boolean,
  { personaId, isDefaultOnCreate = true }: UseUserPersonaOptions = {},
): UseUserPersonaResult {
  const [form, setFormState] = useState<UserPersonaForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const loadKeyRef = useRef<string | null>(null)
  const avatarUriRef = useRef<string | null>(null)
  const persistedFormRef = useRef<UserPersonaForm>(EMPTY_FORM)

  const setForm = useCallback((updater: (prev: UserPersonaForm) => UserPersonaForm) => {
    setFormState(updater)
  }, [])

  const commitForm = useCallback((next: UserPersonaForm) => {
    persistedFormRef.current = next
    setFormState(next)
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
    setFormState(persistedFormRef.current)
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      loadKeyRef.current = null
      return
    }

    const loadKey =
      personaId === undefined ? '__default__' : personaId === null ? '__create__' : personaId
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    if (personaId === null) {
      commitForm(EMPTY_FORM)
      setLoading(false)
      setError(false)
      return
    }

    setLoading(true)
    setError(false)

    userPersonaApi
      .list()
      .then(resp => {
        const items = resp.items ?? []
        const picked =
          personaId === undefined
            ? (items.find(item => item.is_current) ?? items[0])
            : items.find(item => item.persona_id === personaId)
        if (picked) commitForm(toForm(picked))
        else if (personaId !== undefined) commitForm(EMPTY_FORM)
      })
      .catch(e => {
        console.error('[useUserPersona] load failed:', e)
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [enabled, personaId])

  const save = useCallback(async (): Promise<{ ok: boolean; auditFailed?: boolean; personaId?: string; persona?: UserPersonaItem }> => {
    const name = normalizePersonaName(form.name)
    if (!name) return { ok: false }
    setSaving(true)
    try {
      let avatarUrl: StorageObject | undefined
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
          name,
          gender: form.gender,
          profile: form.profile,
          avatar_url: avatarUrl,
        })
        commitForm(toForm(resp.persona))
        syncMeProfileFromPersona(resp.persona)
        avatarUriRef.current = null
        return { ok: true, personaId: resp.persona.persona_id, persona: resp.persona }
      }

      const resp = await userPersonaApi.create({
        name,
        gender: form.gender,
        profile: form.profile,
        avatar_url: avatarUrl,
      })
      commitForm(toForm(resp.persona))
      syncMeProfileFromPersona(resp.persona)
      avatarUriRef.current = null
      return { ok: true, personaId: resp.persona.persona_id, persona: resp.persona }
    } catch (e) {
      console.error('[useUserPersona] save failed:', e)
      if (e instanceof PersonaAvatarAuditError) {
        return { ok: false, auditFailed: true }
      }
      return { ok: false }
    } finally {
      setSaving(false)
    }
  }, [form, isDefaultOnCreate])

  return { form, loading, saving, error, avatarUploading, setForm, pickAvatar, save }
}
