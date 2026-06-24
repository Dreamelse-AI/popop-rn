import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorEvent,
  type ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition'

import {
  isSpeechRecognitionSupported,
  requestSpeechRecognitionPermissions,
  resolveSpeechRecognitionLang,
} from '@/features/chat/lib/speech-recognition'

export type MatchVoicePhase = 'idle' | 'requesting' | 'recording' | 'processing'

export type MatchVoiceError = 'permission' | 'no-speech' | 'network' | null

export type MatchVoiceResult = {
  transcript: string
  error: MatchVoiceError
}

export type MatchVoiceControls = {
  phase: MatchVoicePhase
  interimTranscript: string
  startRecording: () => Promise<void>
  finishRecording: () => Promise<MatchVoiceResult | null>
  cancelRecording: () => void
}

const STOP_TIMEOUT_MS = Platform.OS === 'android' ? 4000 : 2000

/**
 * 匿名匹配专用语音输入：仅做实时语音转文字（live ASR），不录音频文件、不与角色聊天共用 recorder。
 * 转写结果由调用方落到己方输入框，不自动发送。
 */
export function useMatchVoiceRecorder(): MatchVoiceControls {
  const supported = isSpeechRecognitionSupported()

  const [phase, setPhase] = useState<MatchVoicePhase>('idle')
  const [interimTranscript, setInterimTranscript] = useState('')

  const phaseRef = useRef<MatchVoicePhase>('idle')
  const finalRef = useRef('')
  const interimRef = useRef('')
  const cancelledRef = useRef(false)
  const errorRef = useRef<MatchVoiceError>(null)
  const finishResolveRef = useRef<((result: MatchVoiceResult | null) => void) | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setPhaseSafe = useCallback((next: MatchVoicePhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const updateInterim = useCallback((text: string) => {
    interimRef.current = text
    setInterimTranscript(text)
  }, [])

  const reset = useCallback(() => {
    finalRef.current = ''
    interimRef.current = ''
    cancelledRef.current = false
    errorRef.current = null
    updateInterim('')
    setPhaseSafe('idle')
  }, [setPhaseSafe, updateInterim])

  const resolveFinish = useCallback((result: MatchVoiceResult | null) => {
    if (stopTimerRef.current !== null) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    const resolve = finishResolveRef.current
    finishResolveRef.current = null
    resolve?.(result)
  }, [])

  const handleResult = useCallback(
    (event: ExpoSpeechRecognitionResultEvent) => {
      if (!event.results?.length) return
      const text = event.results[0]?.transcript ?? ''
      if (!text) return
      if (event.isFinal) {
        finalRef.current += text
        interimRef.current = ''
      } else {
        interimRef.current = text
      }
      updateInterim((finalRef.current + interimRef.current).trim())
    },
    [updateInterim],
  )

  const handleEnd = useCallback(() => {
    if (!finishResolveRef.current) return
    const transcript = cancelledRef.current ? '' : (finalRef.current + interimRef.current).trim()
    const error = errorRef.current
    reset()
    resolveFinish({ transcript, error })
  }, [reset, resolveFinish])

  const handleError = useCallback((event: ExpoSpeechRecognitionErrorEvent) => {
    if (event.error === 'no-speech') {
      errorRef.current = 'no-speech'
    } else if (event.error === 'network') {
      errorRef.current = 'network'
    } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      errorRef.current = 'permission'
    }
  }, [])

  useEffect(() => {
    if (!supported) return
    const resultListener = ExpoSpeechRecognitionModule.addListener('result', handleResult)
    const endListener = ExpoSpeechRecognitionModule.addListener('end', handleEnd)
    const errorListener = ExpoSpeechRecognitionModule.addListener('error', handleError)
    return () => {
      resultListener.remove()
      endListener.remove()
      errorListener.remove()
    }
  }, [handleEnd, handleError, handleResult, supported])

  const startRecording = useCallback(async () => {
    if (phaseRef.current !== 'idle') return
    setPhaseSafe('requesting')
    finalRef.current = ''
    interimRef.current = ''
    cancelledRef.current = false
    errorRef.current = null
    updateInterim('')

    const granted = await requestSpeechRecognitionPermissions()
    if (!granted) {
      errorRef.current = 'permission'
      resolveFinish(null)
      reset()
      return
    }

    try {
      ExpoSpeechRecognitionModule.start({
        lang: resolveSpeechRecognitionLang(),
        interimResults: true,
        continuous: Platform.OS === 'android',
        iosCategory: {
          category: 'playAndRecord',
          categoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
          mode: 'measurement',
        },
      })
      setPhaseSafe('recording')
    } catch {
      errorRef.current = 'permission'
      reset()
    }
  }, [reset, resolveFinish, setPhaseSafe, updateInterim])

  const finishRecording = useCallback(async (): Promise<MatchVoiceResult | null> => {
    if (phaseRef.current === 'requesting') {
      cancelledRef.current = true
      try {
        ExpoSpeechRecognitionModule.abort()
      } catch {
        /* noop */
      }
      reset()
      return null
    }
    if (phaseRef.current !== 'recording') return null

    setPhaseSafe('processing')
    return new Promise<MatchVoiceResult | null>(resolve => {
      finishResolveRef.current = resolve
      try {
        ExpoSpeechRecognitionModule.stop()
      } catch {
        resolveFinish(null)
        reset()
        return
      }
      // 兜底：部分平台 stop 后不一定立刻触发 end 事件
      stopTimerRef.current = setTimeout(() => {
        if (!finishResolveRef.current) return
        const transcript = cancelledRef.current ? '' : (finalRef.current + interimRef.current).trim()
        const error = errorRef.current
        reset()
        resolveFinish({ transcript, error })
      }, STOP_TIMEOUT_MS)
    })
  }, [reset, resolveFinish, setPhaseSafe])

  const cancelRecording = useCallback(() => {
    if (phaseRef.current === 'idle') return
    cancelledRef.current = true
    try {
      ExpoSpeechRecognitionModule.abort()
    } catch {
      /* noop */
    }
    resolveFinish(null)
    reset()
  }, [reset, resolveFinish])

  useEffect(
    () => () => {
      if (stopTimerRef.current !== null) clearTimeout(stopTimerRef.current)
      try {
        ExpoSpeechRecognitionModule.abort()
      } catch {
        /* noop */
      }
    },
    [],
  )

  return {
    phase,
    interimTranscript,
    startRecording,
    finishRecording,
    cancelRecording,
  }
}
