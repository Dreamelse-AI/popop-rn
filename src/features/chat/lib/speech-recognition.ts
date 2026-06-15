import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionResultEvent,
  type ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition'

export type SpeechRecognitionSession = {
  start: () => void
  stop: () => Promise<string>
  abort: () => void
  getInterimTranscript: () => string
}

export function isSpeechRecognitionSupported(): boolean {
  return true
}

export function createSpeechRecognitionSession(
  options: { lang?: string } = {},
): SpeechRecognitionSession | null {
  const lang = options.lang ?? 'zh-CN'

  let finalTranscript = ''
  let interimTranscript = ''
  let stopped = false
  let resolveStop: ((value: string) => void) | null = null

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
  }

  const errorListener = (_event: ExpoSpeechRecognitionErrorEvent) => {
    cleanup()
    resolveStop?.((finalTranscript + interimTranscript).trim())
    resolveStop = null
  }

  const endListener = () => {
    cleanup()
    if (stopped && resolveStop) {
      resolveStop((finalTranscript + interimTranscript).trim())
      resolveStop = null
    }
  }

  function cleanup() {
    ExpoSpeechRecognitionModule.removeListener('result', resultListener)
    ExpoSpeechRecognitionModule.removeListener('error', errorListener)
    ExpoSpeechRecognitionModule.removeListener('end', endListener)
  }

  function attachListeners() {
    ExpoSpeechRecognitionModule.addListener('result', resultListener)
    ExpoSpeechRecognitionModule.addListener('error', errorListener)
    ExpoSpeechRecognitionModule.addListener('end', endListener)
  }

  return {
    start: () => {
      finalTranscript = ''
      interimTranscript = ''
      stopped = false
      attachListeners()
      try {
        ExpoSpeechRecognitionModule.start({
          lang,
          interimResults: true,
          continuous: true,
        })
      } catch {
        cleanup()
      }
    },
    stop: () =>
      new Promise(resolve => {
        stopped = true
        resolveStop = resolve
        try {
          ExpoSpeechRecognitionModule.stop()
        } catch {
          cleanup()
          resolve((finalTranscript + interimTranscript).trim())
          resolveStop = null
        }
        setTimeout(() => {
          if (resolveStop) {
            cleanup()
            resolveStop((finalTranscript + interimTranscript).trim())
            resolveStop = null
          }
        }, 2000)
      }),
    abort: () => {
      stopped = true
      resolveStop = null
      cleanup()
      try {
        ExpoSpeechRecognitionModule.abort()
      } catch { /* noop */ }
    },
    getInterimTranscript: () => (finalTranscript + interimTranscript).trim(),
  }
}
