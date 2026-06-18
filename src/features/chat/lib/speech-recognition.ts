import { Platform } from 'react-native'
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorEvent,
  type ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition'

import i18n from '@/i18n'
import { toApiLanguage } from '@/shared/api/locale-headers'

const FILE_TRANSCRIBE_TIMEOUT_MS = 30_000

export function resolveSpeechRecognitionLang(language: string = i18n.language): string {
  switch (toApiLanguage(language)) {
    case 'ko':
      return 'ko-KR'
    case 'ja':
      return 'ja-JP'
    case 'en':
      return 'en-US'
    case 'zh-Hans':
      return 'zh-CN'
    case 'zh-Hant':
      return 'zh-TW'
    default:
      return 'zh-CN'
  }
}

export function isSpeechRecognitionSupported(): boolean {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable()
  } catch {
    return Platform.OS === 'ios' || Platform.OS === 'android'
  }
}

export async function requestSpeechRecognitionPermissions(): Promise<boolean> {
  try {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    return result.granted
  } catch {
    return false
  }
}

export type TranscribeAudioFileOptions = {
  lang?: string
  onInterim?: (text: string) => void
}

/** 录音结束后对本地音频文件做 ASR（不占用麦克风，可与 expo-audio 录音解耦） */
export function transcribeAudioFile(
  uri: string,
  options: TranscribeAudioFileOptions = {},
): Promise<string> {
  const lang = options.lang ?? resolveSpeechRecognitionLang()

  let finalTranscript = ''
  let interimTranscript = ''
  let finished = false
  let resolveDone: ((value: string) => void) | null = null

  const emitInterim = () => {
    options.onInterim?.((finalTranscript + interimTranscript).trim())
  }

  const finish = (text?: string) => {
    if (finished) return
    finished = true
    cleanup()
    try {
      ExpoSpeechRecognitionModule.abort()
    } catch {
      /* noop */
    }
    const transcript = (text ?? finalTranscript + interimTranscript).trim()
    resolveDone?.(transcript)
    resolveDone = null
  }

  const resultListener = (event: ExpoSpeechRecognitionResultEvent) => {
    if (!event.results || event.results.length === 0) return
    const result = event.results[0]
    if (!result) return
    const text = result.transcript ?? ''
    if (event.isFinal) {
      finalTranscript += text
      interimTranscript = ''
    } else {
      interimTranscript = text
    }
    emitInterim()
  }

  const errorListener = (_event: ExpoSpeechRecognitionErrorEvent) => {
    finish()
  }

  const endListener = () => {
    finish()
  }

  function cleanup() {
    ExpoSpeechRecognitionModule.removeListener('result', resultListener)
    ExpoSpeechRecognitionModule.removeListener('error', errorListener)
    ExpoSpeechRecognitionModule.removeListener('end', endListener)
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function attachListeners() {
    ExpoSpeechRecognitionModule.addListener('result', resultListener)
    ExpoSpeechRecognitionModule.addListener('error', errorListener)
    ExpoSpeechRecognitionModule.addListener('end', endListener)
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return new Promise(resolve => {
    resolveDone = resolve
    attachListeners()
    options.onInterim?.('')
    timeoutId = setTimeout(() => finish(), FILE_TRANSCRIBE_TIMEOUT_MS)

    try {
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        requiresOnDeviceRecognition: Platform.OS === 'ios',
        audioSource:
          Platform.OS === 'android'
            ? {
                uri,
                audioChannels: 1,
                sampleRate: 16000,
              }
            : { uri },
      })
    } catch {
      finish()
    }
  })
}
