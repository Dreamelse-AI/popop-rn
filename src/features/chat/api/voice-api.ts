import * as Crypto from 'expo-crypto'
import type { Media } from '@/generated/arca_apiComponents';

import { userVoiceDisplayDurationSec } from '../lib/voice-duration';

import { USE_MOCK } from './chat-api';
import { transcribeVoiceWithBackend } from './voice-asr-api';

export type TranscribeVoiceInput = {
  uri: string;
  transcript?: string;
  durationMs?: number;
};

export type TranscribeVoiceResult = {
  transcript: string;
  voice: Media;
};

const FALLBACK_TRANSCRIPT = '（未识别到语音内容）';

function buildVoiceMedia(uri: string, durationMs: number): Media {
  return {
    id: Crypto.randomUUID(),
    url: uri,
    media_type: 'audio',
    duration: durationMs,
  };
}

/**
 * 语音发送：录音上传 TOS 后调用后端 /file/asr_recognize 取识别文本（参考 fe）。
 * Mock 或后端识别失败时回落到本地 ASR / 占位文案，避免空气泡。
 */
export async function transcribeVoice({
  uri,
  transcript,
  durationMs = 0,
}: TranscribeVoiceInput): Promise<TranscribeVoiceResult> {
  const localTranscript = transcript?.trim() ?? '';

  if (USE_MOCK) {
    return {
      transcript: localTranscript || FALLBACK_TRANSCRIPT,
      voice: buildVoiceMedia(uri, durationMs),
    };
  }

  try {
    const { text, storageObject } = await transcribeVoiceWithBackend(uri);
    return {
      transcript: text || localTranscript || FALLBACK_TRANSCRIPT,
      voice: buildVoiceMedia(storageObject.url ?? uri, durationMs),
    };
  } catch {
    return {
      transcript: localTranscript || FALLBACK_TRANSCRIPT,
      voice: buildVoiceMedia(uri, durationMs),
    };
  }
}

export function userVoiceDisplaySecFromTranscript(transcript: string): number {
  return userVoiceDisplayDurationSec(transcript.length);
}
