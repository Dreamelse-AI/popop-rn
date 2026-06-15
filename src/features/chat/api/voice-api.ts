import * as Crypto from 'expo-crypto'
import type { Media } from '@/generated/arca_apiComponents';

import { uploadAudioToTos } from '../lib/tos-upload';
import { userVoiceDisplayDurationSec } from '../lib/voice-duration';

import { USE_MOCK } from './chat-api';

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

async function buildVoiceMedia(uri: string, durationMs: number): Promise<Media> {
  if (USE_MOCK) {
    return {
      id: Crypto.randomUUID(),
      url: uri,
      media_type: 'audio',
      duration: durationMs,
    };
  }

  try {
    const url = await uploadAudioToTos(uri);
    return {
      id: Crypto.randomUUID(),
      url,
      media_type: 'audio',
      duration: durationMs,
    };
  } catch {
    return {
      id: Crypto.randomUUID(),
      url: uri,
      media_type: 'audio',
      duration: durationMs,
    };
  }
}

/** 语音上传 + ASR：使用录音时 Web Speech API 识别结果，无内容时使用 fallback */
export async function transcribeVoice({
  uri,
  transcript,
  durationMs = 0,
}: TranscribeVoiceInput): Promise<TranscribeVoiceResult> {
  const finalTranscript = transcript?.trim() || FALLBACK_TRANSCRIPT;
  const voice = await buildVoiceMedia(uri, durationMs);

  return { transcript: finalTranscript, voice };
}

export function userVoiceDisplaySecFromTranscript(transcript: string): number {
  return userVoiceDisplayDurationSec(transcript.length);
}
