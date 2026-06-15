import { useCallback, useEffect, useRef } from 'react';

import type { PhoneMessageOutput } from '@/generated/arca_apiComponents';

import { CHARS_PER_SECOND } from '../config/chat-config';
import { markCharacterMessagesReadFromOutputs } from '../lib/mark-messages-read';
import { scheduleFollowUp } from '../lib/follow-up-scheduler';
import { buildPlaybackUnits, type PlaybackUnit } from '../lib/phone-message-adapter';
import { isActiveChatSession } from '../lib/session-guard';
import { useChatSessionStore } from '../store/chat-session-store';

export type ReplyPlaybackControls = {
  startPlayback: (characterId: string, outputs: PhoneMessageOutput[]) => void;
  cancelPlayback: () => void;
};

export function useReplyPlayback(): ReplyPlaybackControls {
  const appendMessage = useChatSessionStore(s => s.appendMessage);
  const setTyping = useChatSessionStore(s => s.setTyping);
  const setOutboundPhase = useChatSessionStore(s => s.setOutboundPhase);

  const timerRef = useRef<number | null>(null);
  const queueRef = useRef<PlaybackUnit[]>([]);
  const cancelledRef = useRef(false);
  const playbackCharacterIdRef = useRef<string | null>(null);
  const playbackOutputsRef = useRef<PhoneMessageOutput[]>([]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const playNext = useCallback(() => {
    const characterId = playbackCharacterIdRef.current;
    if (!characterId || !isActiveChatSession(characterId)) {
      clearTimer();
      queueRef.current = [];
      playbackCharacterIdRef.current = null;
      return;
    }

    if (cancelledRef.current) {
      clearTimer();
      queueRef.current = [];
      playbackCharacterIdRef.current = null;
      return;
    }

    const next = queueRef.current.shift();
    if (!next) {
      clearTimer();
      queueRef.current = [];
      const finishedCharacterId = playbackCharacterIdRef.current;
      const finishedOutputs = playbackOutputsRef.current;
      playbackCharacterIdRef.current = null;
      playbackOutputsRef.current = [];
      setTyping(false);
      setOutboundPhase('idle');
      if (finishedCharacterId) {
        markCharacterMessagesReadFromOutputs(finishedCharacterId, finishedOutputs);
      }
      return;
    }

    appendMessage(next.message);

    const following = queueRef.current[0];
    if (!following) {
      timerRef.current = setTimeout(() => {
        playNext();
      }, 0);
      return;
    }

    const delayMs = Math.ceil((next.charCount / CHARS_PER_SECOND) * 1000);
    timerRef.current = setTimeout(() => {
      playNext();
    }, delayMs);
  }, [appendMessage, clearTimer, setOutboundPhase, setTyping]);

  const startPlayback = useCallback(
    (characterId: string, outputs: PhoneMessageOutput[]) => {
      if (!isActiveChatSession(characterId)) return;

      clearTimer();
      cancelledRef.current = false;
      playbackCharacterIdRef.current = characterId;
      playbackOutputsRef.current = outputs;

      const emojiDescriptions = useChatSessionStore.getState().emojiDescriptions;
      queueRef.current = buildPlaybackUnits(outputs, { emojiDescriptions });
      setOutboundPhase('playingReply');
      setTyping(true);
      playNext();
    },
    [clearTimer, playNext, setOutboundPhase, setTyping],
  );

  const cancelPlayback = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    queueRef.current = [];
    playbackCharacterIdRef.current = null;
    setOutboundPhase('queuing');
  }, [clearTimer, setOutboundPhase]);

  useEffect(() => {
    return () => {
      const characterId = playbackCharacterIdRef.current;
      const hadPendingPlayback = queueRef.current.length > 0;
      clearTimer();

      if (characterId && isActiveChatSession(characterId)) {
        if (hadPendingPlayback) {
          for (const unit of queueRef.current) {
            appendMessage(unit.message);
          }
        }

        if (useChatSessionStore.getState().outboundPhase === 'playingReply') {
          setTyping(false);
          setOutboundPhase('idle');
        }
      } else if (characterId && hadPendingPlayback) {
        // 切到其他角色：为原角色启动 follow-up（回复已在服务端落库）
        scheduleFollowUp(characterId);
      }

      queueRef.current = [];
      playbackCharacterIdRef.current = null;
    };
  }, [appendMessage, clearTimer, setOutboundPhase, setTyping]);

  return { startPlayback, cancelPlayback };
}
