import { VOICE_CHARS_PER_MINUTE, VOICE_MAX_DISPLAY_SEC } from '../config/chat-config';

/** 用户语音条展示时长：min(60, ceil(charCount/200*60)) 秒 */
export function userVoiceDisplayDurationSec(charCount: number): number {
  if (charCount <= 0) return 1;
  return Math.min(
    VOICE_MAX_DISPLAY_SEC,
    Math.ceil((charCount / VOICE_CHARS_PER_MINUTE) * 60),
  );
}

/** 录音实际时长（毫秒）→ 展示秒数，至少 1 秒 */
export function recordingDurationSec(durationMs: number): number {
  return Math.max(1, Math.ceil(durationMs / 1000));
}
