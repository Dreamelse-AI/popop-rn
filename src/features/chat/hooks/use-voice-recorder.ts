import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioModule, type AudioRecorder, setAudioModeAsync } from 'expo-audio'

import {
  VOICE_RECORD_CANCEL_HINT_OFFSET_PX,
  VOICE_RECORD_CANCEL_OFFSET_PX,
  VOICE_RECORD_MIN_DURATION_MS,
} from '../config/chat-config'
import {
  createSpeechRecognitionSession,
  isSpeechRecognitionSupported,
  type SpeechRecognitionSession,
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
  const tooShortTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speechSessionRef = useRef<SpeechRecognitionSession | null>(null)
  const interimTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
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

  const stopInterimPolling = useCallback(() => {
    if (interimTimerRef.current !== null) {
      clearInterval(interimTimerRef.current)
      interimTimerRef.current = null
    }
  }, [])

  const startSpeechRecognition = useCallback(() => {
    if (!speechRecognitionAvailable) return

    const session = createSpeechRecognitionSession({ lang: 'zh-CN' })
    if (!session) return

    speechSessionRef.current = session
    session.start()
    setInterimTranscript('')

    stopInterimPolling()
    interimTimerRef.current = setInterval(() => {
      const text = speechSessionRef.current?.getInterimTranscript() ?? ''
      setInterimTranscript(text)
    }, 200)
  }, [speechRecognitionAvailable, stopInterimPolling])

  const stopSpeechRecognition = useCallback(async (): Promise<string> => {
    stopInterimPolling()
    const session = speechSessionRef.current
    speechSessionRef.current = null
    if (!session) {
      setInterimTranscript('')
      return ''
    }

    const transcript = await session.stop()
    setInterimTranscript(transcript)
    return transcript
  }, [stopInterimPolling])

  const abortSpeechRecognition = useCallback(() => {
    stopInterimPolling()
    speechSessionRef.current?.abort()
    speechSessionRef.current = null
    setInterimTranscript('')
  }, [stopInterimPolling])

  const resetRecorder = useCallback(() => {
    abortSpeechRecognition()
    recordingRef.current = null
    cancelledRef.current = false
    setIsCancelled(false)
    setCancelZoneSafe('none')
    setPhaseSafe('idle')
  }, [abortSpeechRecognition, setCancelZoneSafe, setPhaseSafe])

  const startRecording = useCallback(
    async (startY: number) => {
      if (phaseRef.current !== 'idle') return

      startYRef.current = startY
      pressedAtRef.current = Date.now()
      cancelledRef.current = false
      setIsCancelled(false)
      setIsPressTooShort(false)
      setCancelZoneSafe('none')
      setPhaseSafe('requesting')

      try {
        const permissionResult = await AudioModule.requestRecordingPermissionsAsync()
        if (!permissionResult.granted) {
          setPermissionDenied(true)
          resetRecorder()
          return
        }

        setPermissionDenied(false)
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        })

        const recorder = new AudioModule.AudioRecorder({
          extension: '.caf',
        })
        await recorder.prepareToRecordAsync()
        recorder.record()

        recordingRef.current = recorder
        startedAtRef.current = Date.now()
        setPhaseSafe('recording')
        startSpeechRecognition()
      } catch {
        setPermissionDenied(true)
        resetRecorder()
      }
    },
    [resetRecorder, setCancelZoneSafe, setPhaseSafe, startSpeechRecognition],
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
        recorder.release()
      } catch { /* already stopped */ }
    }

    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
    resetRecorder()
    setTimeout(() => setIsCancelled(false), 600)
    return null
  }, [resetRecorder, setCancelZoneSafe])

  const cancelRecording = useCallback(() => {
    void discardRecording()
  }, [discardRecording])

  const updatePointer = useCallback(
    (clientY: number) => {
      if (phaseRef.current !== 'recording') return
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
      if (pressDurationMs < VOICE_RECORD_MIN_DURATION_MS) {
        flashPressTooShort()
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
      const transcript = await stopSpeechRecognition()

      recorder.release()
      recordingRef.current = null
      cancelledRef.current = false
      setIsCancelled(false)
      setCancelZoneSafe('none')
      setPhaseSafe('idle')

      if (!uri) return null

      return { uri, durationMs, transcript }
    } catch {
      resetRecorder()
      return null
    }
  }, [discardRecording, flashPressTooShort, resetRecorder, setCancelZoneSafe, setPhaseSafe, stopSpeechRecognition])

  useEffect(
    () => () => {
      if (tooShortTimerRef.current !== null) {
        clearTimeout(tooShortTimerRef.current)
      }
      stopInterimPolling()
      abortSpeechRecognition()
    },
    [abortSpeechRecognition, stopInterimPolling],
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
