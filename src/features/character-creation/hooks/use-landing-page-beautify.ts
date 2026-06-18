import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  resumeLandingPageGeneration,
  submitLandingPageGeneration,
} from '@/features/character-creation/api/gen-landing-page-api'
import { fetchLandingPagePreviewUrl } from '@/features/character-creation/api/gen-landing-preview-api'
import type { FlushToServerResult } from '@/features/character-creation/hooks/use-character-draft-form'
import type { CharacterEditMode } from '@/features/character-creation/lib/character-edit-mode'
import {
  buildGenLandingPageRequest,
  buildLandingPreviewApiForm,
} from '@/features/character-creation/lib/form-mapper'
import {
  clearLandingPageGenTask,
  loadLandingPageGenTask,
  saveLandingPageGenTask,
} from '@/features/character-creation/lib/landing-page-gen-task-store'
import type { CharacterDraftFormState } from '@/features/character-creation/types/form'
import { showGlobalToast } from '@/shared/wallet'

export type LandingPageGenerateState = 'idle' | 'generating' | 'regenerate'

type UseLandingPageBeautifyOptions = {
  form: CharacterDraftFormState | null
  patchForm: (patch: Partial<CharacterDraftFormState>) => void
  flushToServer: () => Promise<FlushToServerResult>
  storageId: string
  editMode: CharacterEditMode
  characterId?: string
}

export function useLandingPageBeautify({
  form,
  patchForm,
  flushToServer,
  storageId,
  editMode,
  characterId,
}: UseLandingPageBeautifyOptions) {
  const { t } = useTranslation()
  const formRef = useRef(form)
  formRef.current = form

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const pollAbortRef = useRef<AbortController | null>(null)
  const resumeStartedRef = useRef(false)

  const generateState: LandingPageGenerateState = generating
    ? 'generating'
    : (form?.landingPageUrl ?? '').trim()
      ? 'regenerate'
      : 'idle'

  const finishGeneration = useCallback(
    async (url: string) => {
      clearLandingPageGenTask(storageId)
      patchForm({ landingPageUrl: url })
      await flushToServer()
    },
    [flushToServer, patchForm, storageId],
  )

  const runPoll = useCallback(
    async (taskId: string, signal: AbortSignal) => {
      setGenerating(true)
      try {
        const resp = await resumeLandingPageGeneration(taskId, signal)
        const url = resp.url?.trim()
        if (!url) {
          throw new Error('gen_landing_page returned empty url')
        }
        await finishGeneration(url)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.warn('[useLandingPageBeautify] generation failed:', error)
        clearLandingPageGenTask(storageId)
        showGlobalToast(t('character.createPage.beautifyGenerateFailed', 'Landing page generation failed'))
      } finally {
        if (!signal.aborted) {
          setGenerating(false)
        }
      }
    },
    [finishGeneration, storageId, t],
  )

  useEffect(() => {
    if (!form || resumeStartedRef.current) return

    const cached = loadLandingPageGenTask(storageId)
    if (!cached?.taskId) return

    resumeStartedRef.current = true
    pollAbortRef.current?.abort()
    const controller = new AbortController()
    pollAbortRef.current = controller
    void runPoll(cached.taskId, controller.signal)

    return () => {
      controller.abort()
    }
  }, [form, runPoll, storageId])

  useEffect(() => {
    return () => {
      pollAbortRef.current?.abort()
    }
  }, [])

  const openPreview = useCallback(async () => {
    const current = formRef.current
    if (!current) return

    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewUrl(null)

    const storedUrl = (current.landingPageUrl ?? '').trim()
    if (storedUrl) {
      setPreviewUrl(storedUrl)
      setPreviewLoading(false)
      return
    }

    try {
      const url = await fetchLandingPagePreviewUrl(buildLandingPreviewApiForm(current))
      setPreviewUrl(url)
    } catch (error) {
      console.warn('[useLandingPageBeautify] gen_landing_preview failed:', error)
      setPreviewUrl(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const closePreview = useCallback(() => {
    setPreviewOpen(false)
    setPreviewLoading(false)
    setPreviewUrl(null)
  }, [])

  const handleGenerate = useCallback(async () => {
    const current = formRef.current
    if (!current || generating) return

    const styleKey = (current.landingPageStyleKey ?? '').trim()
    if (!styleKey) return

    pollAbortRef.current?.abort()
    const controller = new AbortController()
    pollAbortRef.current = controller

    setGenerating(true)
    try {
      const req = buildGenLandingPageRequest(current, {
        characterId: editMode === 'character' ? characterId ?? current.targetCharacterId : undefined,
      })

      const submitResp = await submitLandingPageGeneration(req)
      if (!submitResp?.task_id) {
        setGenerating(false)
        return
      }

      saveLandingPageGenTask(storageId, {
        taskId: submitResp.task_id,
        startedAt: Date.now(),
      })

      const resp = await resumeLandingPageGeneration(submitResp.task_id, controller.signal)
      const url = resp.url?.trim()
      if (!url) {
        throw new Error('gen_landing_page returned empty url')
      }

      await finishGeneration(url)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return

      console.warn('[useLandingPageBeautify] submit generation failed:', error)
      clearLandingPageGenTask(storageId)
      showGlobalToast(t('character.createPage.beautifyGenerateFailed', 'Landing page generation failed'))
    } finally {
      if (!controller.signal.aborted) {
        setGenerating(false)
      }
    }
  }, [characterId, editMode, finishGeneration, generating, storageId, t])

  const handleRestoreDefault = useCallback(() => {
    pollAbortRef.current?.abort()
    pollAbortRef.current = null
    clearLandingPageGenTask(storageId)
    setGenerating(false)
    patchForm({
      landingPageStyleKey: '',
      landingPagePrompt: '',
      landingPageUrl: '',
    })
  }, [patchForm, storageId])

  return {
    previewOpen,
    previewUrl,
    previewLoading,
    generating,
    generateState,
    openPreview,
    closePreview,
    handleGenerate,
    handleRestoreDefault,
  }
}
