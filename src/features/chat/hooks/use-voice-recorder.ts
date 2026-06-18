import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioRecorder,
} from 'expo-audio'

import {
  VOICE_RECORD_CANCEL_HINT_OFFSET_PX,
  VOICE_RECORD_CANCEL_OFFSET_PX,
  VOICE_RECORD_MIN_DURATION_MS,
} from '../config/chat-config'
import {
  isSpeechRecognitionSupported,
  requestSpeechRecognitionPermissions,
  resolveSpeechRecognitionLang,
  transcribeAudioFile,
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

export function useVoiceRecorder(): VoiceRecorderControls {
  const [phase, setPhase] = useState<VoiceRecorderPhase>('idle')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [isPressTooShort, setIsPressTooShort] = useState(false)
  const [cancelZone, setCancelZone] = useState<VoiceCancelZone>('none')
  const [interimTranscript, setInterimTranscript] = useState('')
  const phaseRef = useRef<VoiceRecorderPhase>('idle')
  const cancelZoneRef = useRef<VoiceCancelZone>('none')

  const recordingRef = useRef<AudioRecorder | null>(null)
  const startYRef = useRef(0)
  const pressedAtRef = useRef(0)
  const startedAtRef = useRef(0)
  const cancelledRef = useRef(false)
  const abortRequestedRef = useRef(false)
  const tooShortTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speechRecognitionAvailable = isSpeechRecognitionSupported()

  const setPhaseSafe = useCallback((next: VoiceRecorderPhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const setCancelZoneSafe = useCallback((next: VoiceCancelZone) => {
    cancelZoneRef.current = next
    setCancelZone(next)
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

  const releaseRecorder = useCallback((recorder: AudioRecorder | null) => {
    if (!recorder) return
    try {
      if (typeof recorder.release === 'function') {
        recorder.release()
      }
    } catch {
      /* recorder already released */
    }
  }, [])

  const resetRecorder = useCallback(() => {
    releaseRecorder(recordingRef.current)
    recordingRef.current = null
    cancelledRef.current = false
    abortRequestedRef.current = false
    setInterimTranscript('')
    setIsCancelled(false)
    setCancelZoneSafe('none')
    setPhaseSafe('idle')
  }, [releaseRecorder, setCancelZoneSafe, setPhaseSafe])

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
      setInterimTranscript('')
      setPhaseSafe('requesting')

      try {
        const permissionResult = await requestRecordingPermissionsAsync()
        if (!permissionResult.granted) {
          setPermissionDenied(true)
          resetRecorder()
          return
        }

        if (speechRecognitionAvailable) {
          const speechGranted = await requestSpeechRecognitionPermissions()
          if (!speechGranted) {
            setPermissionDenied(true)
            resetRecorder()
            return
          }
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

        const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY)
        await recorder.prepareToRecordAsync()
        recorder.record()

        recordingRef.current = recorder
        startedAtRef.current = Date.now()
        setPhaseSafe('recording')
      } catch {
        setPermissionDenied(true)
        releaseRecorder(recordingRef.current)
        recordingRef.current = null
        resetRecorder()
      }
    },
    [flashPressTooShort, releaseRecorder, resetRecorder, setCancelZoneSafe, setPhaseSafe, speechRecognitionAvailable],
  )

  const discardRecording = useCallback(async (): Promise<null> => {
    if (phaseRef.current === 'idle') return null

    cancelledRef.current = true
    setIsCancelled(true)
    setCancelZoneSafe('none')

    const recorder = recordingRef.current
    if (recorder) {
      try {
        await recorder.stop()
      } catch {
        /* already stopped */
      }
      releaseRecorder(recorder)
    }

    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
    resetRecorder()
    setTimeout(() => setIsCancelled(false), 600)
    return null
  }, [resetRecorder, releaseRecorder, setCancelZoneSafe])

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

  const finishRecording = useCallback(async (): Promise<VoiceRecorderResult | null> => {
    const pressDurationMs = Date.now() - pressedAtRef.current

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

    setPhaseSafe('processing')
    setInterimTranscript('')

    const recorder = recordingRef.current
    if (!recorder) {
      resetRecorder()
      return null
    }

    try {
      await recorder.stop()
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })

      const uri = recorder.uri
      const status = recorder.getStatus()
      const durationMs = status.durationMillis > 0
        ? status.durationMillis
        : Math.max(0, Date.now() - startedAtRef.current)

      releaseRecorder(recorder)
      recordingRef.current = null

      if (!uri) {
        resetRecorder()
        return null
      }

      const transcript = speechRecognitionAvailable
        ? await transcribeAudioFile(uri, {
            lang: resolveSpeechRecognitionLang(),
            onInterim: setInterimTranscript,
          })
        : ''

      cancelledRef.current = false
      setIsCancelled(false)
      setCancelZoneSafe('none')
      setPhaseSafe('idle')

      return { uri, durationMs, transcript }
    } catch {
      resetRecorder()
      return null
    }
  }, [discardRecording, flashPressTooShort, releaseRecorder, resetRecorder, setCancelZoneSafe, setPhaseSafe, speechRecognitionAvailable])

  useEffect(
    () => () => {
      if (tooShortTimerRef.current !== null) {
        clearTimeout(tooShortTimerRef.current)
      }
    },
    [],
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
