import type { Media } from '@/generated/arca_apiComponents'

import {
  MOCK_VOICE_ASR_MS,
  MOCK_VOICE_TRANSCRIPTS,
} from '../config/chat-config'
import { userVoiceDisplayDurationSec } from '../lib/voice-duration'

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })
}

export async function mockTranscribeVoice(_blob: Blob): Promise<{
  transcript: string
  voice: Media
}> {
  await delay(MOCK_VOICE_ASR_MS)

  const transcript =
    MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)] ??
    '这是一段语音消息。'

  const durationMs = userVoiceDisplayDurationSec(transcript.length) * 1000

  return {
    transcript,
    voice: {
      id: `voice-${Date.now()}`,
      url: '',
      media_type: 'audio',
      duration: durationMs,
    },
  }
}

export function userVoiceDisplaySecFromTranscript(transcript: string): number {
  return userVoiceDisplayDurationSec(transcript.length)
}
