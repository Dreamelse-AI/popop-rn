import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import {
  AudioQuality,
  IOSOutputFormat,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio'
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorEvent,
  type ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition'

import {
  VOICE_RECORD_CANCEL_HINT_OFFSET_PX,
  VOICE_RECORD_CANCEL_OFFSET_PX,
  VOICE_RECORD_MAX_DURATION_MS,
  VOICE_RECORD_MIN_DURATION_MS,
} from '../config/chat-config'
import {
  isSpeechRecognitionSupported,
  requestSpeechRecognitionPermissions,
  resolveSpeechRecognitionLang,
} from '../lib/speech-recognition'

export type VoiceRecorderPhase = 'idle' | 'requesting' | 'recording' | 'processing'

export type VoiceCancelZone = 'none' | 'approaching' | 'active'

export type VoiceRecorderResult = {
  uri: string
  durationMs: number
  transcript: string
}

export type VoiceRecorderControls = {
  phase: VoiceRecorderPhase
  permissionDenied: boolean
  isCancelled: boolean
  isPressTooShort: boolean
  cancelZone: VoiceCancelZone
  interimTranscript: string
  speechRecognitionAvailable: boolean
  startRecording: (startY: number) => Promise<void>
  updatePointer: (clientY: number) => void
  finishRecording: () => Promise<VoiceRecorderResult | null>
  cancelRecording: () => void
}

type UseVoiceRecorderOptions = {
  /** 录音达到上限时触发（仍按住时由上层完成发送） */
  onMaxDurationReached?: () => void
}

const FALLBACK_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
}

function canUseSpeechRecording(): boolean {
  if (!isSpeechRecognitionSupported()) return false
  try {
    return ExpoSpeechRecognitionModule.supportsRecording()
  } catch {
    return false
  }
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): VoiceRecorderControls {
  const fallbackRecorder = useAudioRecorder(FALLBACK_RECORDING_OPTIONS)
  // 统一走后端 ASR（/file/asr_recognize）：仅用 expo-audio 录制 wav，不依赖 on-device 识别。
  // on-device 识别在模拟器上会报 audio-capture，且后端 ASR 不需要本地转写结果。
  const useSpeechRecording = false

  const onMaxDurationReachedRef = useRef(options.onMaxDurationReached)
  onMaxDurationReachedRef.current = options.onMaxDurationReached

  const [phase, setPhase] = useState<VoiceRecorderPhase>('idle')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [isPressTooShort, setIsPressTooShort] = useState(false)
  const [cancelZone, setCancelZone] = useState<VoiceCancelZone>('none')
  const [interimTranscript, setInterimTranscript] = useState('')

  const phaseRef = useRef<VoiceRecorderPhase>('idle')
  const cancelZoneRef = useRef<VoiceCancelZone>('none')
  const startYRef = useRef(0)
  const pressedAtRef = useRef(0)
  const startedAtRef = useRef(0)
  const cancelledRef = useRef(false)
  const abortRequestedRef = useRef(false)
  const tooShortTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const finalTranscriptRef = useRef('')
  const interimTranscriptRef = useRef('')
  const recordingUriRef = useRef<string | null>(null)
  const finishResolveRef = useRef<((result: VoiceRecorderResult | null) => void) | null>(null)
  const finishStartedAtRef = useRef(0)

  const speechRecognitionAvailable = isSpeechRecognitionSupported()

  const setPhaseSafe = useCallback((next: VoiceRecorderPhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const setCancelZoneSafe = useCallback((next: VoiceCancelZone) => {
    cancelZoneRef.current = next
    setCancelZone(next)
  }, [])

  const updateInterim = useCallback((text: string) => {
    interimTranscriptRef.current = text
    setInterimTranscript(text)
  }, [])

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current !== null) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }
  }, [])

  const flashPressTooShort = useCallback(() => {
    setIsPressTooShort(true)
    if (tooShortTimerRef.current !== null) {
      clearTimeout(tooShortTimerRef.current)
    }
    tooShortTimerRef.current = setTimeout(() => {
      setIsPressTooShort(false)
      tooShortTimerRef.current = null
    }, 600)
  }, [])

  const resetTranscriptState = useCallback(() => {
    finalTranscriptRef.current = ''
    interimTranscriptRef.current = ''
    recordingUriRef.current = null
    updateInterim('')
  }, [updateInterim])

  const resetRecorder = useCallback(() => {
    clearMaxDurationTimer()
    cancelledRef.current = false
    abortRequestedRef.current = false
    resetTranscriptState()
    setIsCancelled(false)
    setCancelZoneSafe('none')
    setPhaseSafe('idle')
  }, [clearMaxDurationTimer, resetTranscriptState, setCancelZoneSafe, setPhaseSafe])

  const resolveFinish = useCallback(
    (result: VoiceRecorderResult | null) => {
      const resolve = finishResolveRef.current
      finishResolveRef.current = null
      resolve?.(result)
    },
    [],
  )

  const handleSpeechResult = useCallback(
    (event: ExpoSpeechRecognitionResultEvent) => {
      if (!event.results?.length) return
      const text = event.results[0]?.transcript ?? ''
      if (!text) return

      if (event.isFinal) {
        finalTranscriptRef.current += text
        interimTranscriptRef.current = ''
      } else {
        interimTranscriptRef.current = text
      }

      updateInterim((finalTranscriptRef.current + interimTranscriptRef.current).trim())
    },
    [updateInterim],
  )

  const handleSpeechEnd = useCallback(() => {
    if (!finishResolveRef.current) return
    if (!recordingUriRef.current) return

    const transcript = (finalTranscriptRef.current + interimTranscriptRef.current).trim()
    const uri = recordingUriRef.current
    const durationMs = Math.max(0, Date.now() - finishStartedAtRef.current)

    finishResolveRef.current = null
    cancelledRef.current = false
    setIsCancelled(false)
    setCancelZoneSafe('none')
    setPhaseSafe('idle')

    resolveFinish({ uri, durationMs, transcript })
  }, [resolveFinish, setCancelZoneSafe, setPhaseSafe])

  const handleSpeechError = useCallback(
    (_event: ExpoSpeechRecognitionErrorEvent) => {
      if (finishResolveRef.current) {
        resolveFinish(null)
        resetRecorder()
      }
    },
    [resetRecorder, resolveFinish],
  )

  useEffect(() => {
    if (!useSpeechRecording) return

    const resultListener = ExpoSpeechRecognitionModule.addListener('result', handleSpeechResult)
    const audioEndListener = ExpoSpeechRecognitionModule.addListener('audioend', event => {
      if (event.uri) {
        recordingUriRef.current = event.uri
      }
    })
    const endListener = ExpoSpeechRecognitionModule.addListener('end', handleSpeechEnd)
    const errorListener = ExpoSpeechRecognitionModule.addListener('error', handleSpeechError)

    return () => {
      resultListener.remove()
      audioEndListener.remove()
      endListener.remove()
      errorListener.remove()
    }
  }, [handleSpeechEnd, handleSpeechError, handleSpeechResult, useSpeechRecording])

  const armMaxDurationTimer = useCallback(() => {
    clearMaxDurationTimer()
    maxDurationTimerRef.current = setTimeout(() => {
      maxDurationTimerRef.current = null
      if (phaseRef.current !== 'recording') return
      onMaxDurationReachedRef.current?.()
    }, VOICE_RECORD_MAX_DURATION_MS)
  }, [clearMaxDurationTimer])

  const startSpeechRecording = useCallback(async () => {
    const speechGranted = await requestSpeechRecognitionPermissions()
    if (!speechGranted) {
      setPermissionDenied(true)
      resetRecorder()
      return
    }

    if (abortRequestedRef.current) {
      if (Date.now() - pressedAtRef.current < VOICE_RECORD_MIN_DURATION_MS) {
        flashPressTooShort()
      }
      resetRecorder()
      return
    }

    setPermissionDenied(false)
    resetTranscriptState()

    ExpoSpeechRecognitionModule.start({
      lang: resolveSpeechRecognitionLang(),
      interimResults: true,
      continuous: Platform.OS === 'android',
      recordingOptions: {
        persist: true,
        outputFileName: `voice-${Date.now()}.wav`,
      },
      iosCategory: {
        category: 'playAndRecord',
        categoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
        mode: 'measurement',
      },
    })

    startedAtRef.current = Date.now()
    setPhaseSafe('recording')
    armMaxDurationTimer()
  }, [armMaxDurationTimer, flashPressTooShort, resetRecorder, resetTranscriptState, setPhaseSafe])

  const startFallbackRecording = useCallback(async () => {
    const permissionResult = await requestRecordingPermissionsAsync()
    if (!permissionResult.granted) {
      setPermissionDenied(true)
      resetRecorder()
      return
    }

    if (abortRequestedRef.current) {
      if (Date.now() - pressedAtRef.current < VOICE_RECORD_MIN_DURATION_MS) {
        flashPressTooShort()
      }
      resetRecorder()
      return
    }

    setPermissionDenied(false)
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    })

    await fallbackRecorder.prepareToRecordAsync()
    fallbackRecorder.record()

    startedAtRef.current = Date.now()
    setPhaseSafe('recording')
    armMaxDurationTimer()
  }, [armMaxDurationTimer, fallbackRecorder, flashPressTooShort, resetRecorder, setPhaseSafe])

  const startRecording = useCallback(
    async (startY: number) => {
      if (phaseRef.current !== 'idle') return

      startYRef.current = startY
      pressedAtRef.current = Date.now()
      cancelledRef.current = false
      abortRequestedRef.current = false
      setIsCancelled(false)
      setIsPressTooShort(false)
      setCancelZoneSafe('none')
      resetTranscriptState()
      setPhaseSafe('requesting')

      try {
        if (useSpeechRecording) {
          await startSpeechRecording()
          return
        }

        await startFallbackRecording()
      } catch {
        setPermissionDenied(true)
        resetRecorder()
      }
    },
    [
      resetRecorder,
      resetTranscriptState,
      setCancelZoneSafe,
      setPhaseSafe,
      startFallbackRecording,
      startSpeechRecording,
      useSpeechRecording,
    ],
  )

  const discardSpeechRecording = useCallback(async (): Promise<null> => {
    cancelledRef.current = true
    setIsCancelled(true)
    setCancelZoneSafe('none')

    try {
      ExpoSpeechRecognitionModule.abort()
    } catch {
      /* noop */
    }

    resetRecorder()
    setTimeout(() => setIsCancelled(false), 600)
    return null
  }, [resetRecorder, setCancelZoneSafe])

  const discardFallbackRecording = useCallback(async (): Promise<null> => {
    cancelledRef.current = true
    setIsCancelled(true)
    setCancelZoneSafe('none')

    try {
      if (fallbackRecorder.isRecording) {
        await fallbackRecorder.stop()
      }
    } catch {
      /* already stopped */
    }

    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
    resetRecorder()
    setTimeout(() => setIsCancelled(false), 600)
    return null
  }, [fallbackRecorder, resetRecorder, setCancelZoneSafe])

  const discardRecording = useCallback(async (): Promise<null> => {
    if (phaseRef.current === 'idle') return null
    if (useSpeechRecording) return discardSpeechRecording()
    return discardFallbackRecording()
  }, [discardFallbackRecording, discardSpeechRecording, useSpeechRecording])

  const cancelRecording = useCallback(() => {
    void discardRecording()
  }, [discardRecording])

  const updatePointer = useCallback(
    (clientY: number) => {
      if (phaseRef.current !== 'recording' && phaseRef.current !== 'requesting') return
      const offset = startYRef.current - clientY
      if (offset >= VOICE_RECORD_CANCEL_OFFSET_PX) {
        setCancelZoneSafe('active')
      } else if (offset >= VOICE_RECORD_CANCEL_HINT_OFFSET_PX) {
        setCancelZoneSafe('approaching')
      } else {
        setCancelZoneSafe('none')
      }
    },
    [setCancelZoneSafe],
  )

  const finishSpeechRecording = useCallback(async (): Promise<VoiceRecorderResult | null> => {
    setPhaseSafe('processing')
    finishStartedAtRef.current = startedAtRef.current

    return new Promise(resolve => {
      finishResolveRef.current = resolve

      try {
        ExpoSpeechRecognitionModule.stop()
      } catch {
        resolveFinish(null)
        resetRecorder()
        return
      }

      setTimeout(() => {
        if (!finishResolveRef.current) return
        const transcript = (finalTranscriptRef.current + interimTranscriptRef.current).trim()
        const uri = recordingUriRef.current
        const durationMs = Math.max(0, Date.now() - finishStartedAtRef.current)
        resolveFinish(uri ? { uri, durationMs, transcript } : null)
        resetRecorder()
      }, 2500)
    })
  }, [resetRecorder, resolveFinish, setPhaseSafe])

  const finishFallbackRecording = useCallback(async (): Promise<VoiceRecorderResult | null> => {
    setPhaseSafe('processing')
    updateInterim('')

    try {
      await fallbackRecorder.stop()
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })

      const uri = fallbackRecorder.uri
      const status = fallbackRecorder.getStatus()
      const durationMs = status.durationMillis > 0
        ? status.durationMillis
        : Math.max(0, Date.now() - startedAtRef.current)

      if (!uri) {
        resetRecorder()
        return null
      }

      // 不在本地做 on-device 转写：交由后端 /file/asr_recognize 识别。
      // 本地识别在模拟器/部分机型会失败且会增加松手后的延迟。
      const transcript = ''

      cancelledRef.current = false
      setIsCancelled(false)
      setCancelZoneSafe('none')
      setPhaseSafe('idle')

      return { uri, durationMs, transcript }
    } catch {
      resetRecorder()
      return null
    }
  }, [
    fallbackRecorder,
    resetRecorder,
    setCancelZoneSafe,
    setPhaseSafe,
  ])

  const finishRecording = useCallback(async (): Promise<VoiceRecorderResult | null> => {
    const pressDurationMs = Date.now() - pressedAtRef.current
    clearMaxDurationTimer()

    if (phaseRef.current === 'requesting') {
      abortRequestedRef.current = true
      if (pressDurationMs < VOICE_RECORD_MIN_DURATION_MS) {
        flashPressTooShort()
      } else if (cancelZoneRef.current === 'active') {
        cancelledRef.current = true
        setIsCancelled(true)
        setCancelZoneSafe('none')
        setTimeout(() => setIsCancelled(false), 600)
      }
      return null
    }

    if (phaseRef.current !== 'recording') return null

    if (cancelledRef.current || cancelZoneRef.current === 'active') {
      return discardRecording()
    }

    if (pressDurationMs < VOICE_RECORD_MIN_DURATION_MS) {
      flashPressTooShort()
      await discardRecording()
      return null
    }

    if (useSpeechRecording) {
      return finishSpeechRecording()
    }

    return finishFallbackRecording()
  }, [
    discardRecording,
    finishFallbackRecording,
    finishSpeechRecording,
    flashPressTooShort,
    clearMaxDurationTimer,
    setCancelZoneSafe,
    useSpeechRecording,
  ])

  useEffect(
    () => () => {
      if (tooShortTimerRef.current !== null) {
        clearTimeout(tooShortTimerRef.current)
      }
      clearMaxDurationTimer()
      try {
        ExpoSpeechRecognitionModule.abort()
      } catch {
        /* noop */
      }
    },
    [clearMaxDurationTimer],
  )

  return {
    phase,
    permissionDenied,
    isCancelled,
    isPressTooShort,
    cancelZone,
    interimTranscript,
    speechRecognitionAvailable,
    startRecording,
    updatePointer,
    finishRecording,
    cancelRecording,
  }
}
