import { useCallback, useEffect, useRef } from 'react';

import type { PhoneMessageInput } from '@/generated/arca_apiComponents';

import { chatWithCharacter } from '../api/chat-api';
import {
  MAX_OUTBOUND_MESSAGES,
  MAX_OUTBOUND_WAIT_MS,
  READ_DELAY_MS,
} from '../config/chat-config';
import type { EmojiItem } from '@/generated/arca_apiComponents';

import { resetFollowUpConsumed, scheduleFollowUp } from '../lib/follow-up-scheduler';
import { isChatScreenMounted } from '../lib/chat-screen-presence';
import { getEmojiLabel } from '../lib/character-adapter';
import {
  createOptimisticEmojiMessage,
  createOptimisticImageMessage,
  createOptimisticTextMessage,
  createOptimisticVoiceMessage,
} from '../lib/phone-message-adapter';
import { deliverCharacterRepliesImmediately } from '../lib/reply-delivery';
import { isActiveChatSession } from '../lib/session-guard';
import { transcribeVoice, userVoiceDisplaySecFromTranscript } from '../api/voice-api';
import { useChatSessionStore } from '../store/chat-session-store';
import { runPaidAction } from '@/shared/wallet';

import type { ReplyPlaybackControls } from './use-reply-playback';

function randomReadDelayMs() {
  const { min, max } = READ_DELAY_MS;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function useOutboundQueue(characterId: string, playback: ReplyPlaybackControls) {
  const appendMessage = useChatSessionStore(s => s.appendMessage);
  const applyApiCurrentMessages = useChatSessionStore(s => s.applyApiCurrentMessages);
  const clearPendingByLocalIds = useChatSessionStore(s => s.clearPendingByLocalIds);
  const markPendingByLocalIds = useChatSessionStore(s => s.markPendingByLocalIds);
  const markMessagesAsFailed = useChatSessionStore(s => s.markMessagesAsFailed);
  const setTyping = useChatSessionStore(s => s.setTyping);
  const setOutboundPhase = useChatSessionStore(s => s.setOutboundPhase);
  const setCharacterStatus = useChatSessionStore(s => s.setCharacterStatus);

  const queueRef = useRef<PhoneMessageInput[]>([]);
  const pendingLocalIdsRef = useRef<string[]>([]);
  const readDelayTimerRef = useRef<number | null>(null);
  const maxWaitTimerRef = useRef<number | null>(null);
  const firstEnqueueAtRef = useRef<number | null>(null);
  const flushingRef = useRef(false);
  const mountedRef = useRef(true);

  const clearReadDelayTimer = useCallback(() => {
    if (readDelayTimerRef.current !== null) {
      clearTimeout(readDelayTimerRef.current);
      readDelayTimerRef.current = null;
    }
  }, []);

  const clearMaxWaitTimer = useCallback(() => {
    if (maxWaitTimerRef.current !== null) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
  }, []);

  const resetQueueTimers = useCallback(() => {
    clearReadDelayTimer();
    clearMaxWaitTimer();
    firstEnqueueAtRef.current = null;
  }, [clearMaxWaitTimer, clearReadDelayTimer]);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    if (queueRef.current.length === 0) return;

    flushingRef.current = true;
    clearReadDelayTimer();
    clearMaxWaitTimer();
    firstEnqueueAtRef.current = null;

    const messages = queueRef.current.splice(0);
    const pendingIds = pendingLocalIdsRef.current.splice(0);

    if (isActiveChatSession(characterId)) {
      setOutboundPhase('awaitingApi');
      setTyping(true);
    }

    try {
      const resp = await runPaidAction(
        () =>
          chatWithCharacter({
            character_id: characterId,
            chat_scene: 1,
            messages,
          }),
        {
          source: 'chat_with_character',
          onInsufficientBalance: () => {
            if (!isActiveChatSession(characterId)) return;
            markPendingByLocalIds(pendingIds);
            setTyping(false);
            setOutboundPhase('idle');
          },
        },
      );

      if (resp === null) return;
      if (!isActiveChatSession(characterId)) return;

      const hasCharacterReply = resp.character_messages.length > 0;
      applyApiCurrentMessages(resp.current_messages, pendingIds, {
        ignoreServerFailed: !hasCharacterReply,
      });
      clearPendingByLocalIds(pendingIds);
      setCharacterStatus(resp.character_status);

      if (hasCharacterReply) {
        // 当前仍停留在该角色聊天页（可能是切出去又回来后的新实例）：逐条播放回复。
        // 否则（真正离开了该会话）一次性写入并安排 follow-up。
        if (mountedRef.current || isChatScreenMounted(characterId)) {
          playback.startPlayback(characterId, resp.character_messages);
        } else {
          deliverCharacterRepliesImmediately(characterId, resp.character_messages);
          scheduleFollowUp(characterId);
        }
      } else {
        setTyping(false);
        setOutboundPhase('idle');
      }
    } catch {
      if (isActiveChatSession(characterId)) {
        markMessagesAsFailed(pendingIds);
        setTyping(false);
        setOutboundPhase('idle');
      }
    } finally {
      flushingRef.current = false;
    }
  }, [
    applyApiCurrentMessages,
    characterId,
    clearMaxWaitTimer,
    clearPendingByLocalIds,
    clearReadDelayTimer,
    markPendingByLocalIds,
    markMessagesAsFailed,
    playback,
    setCharacterStatus,
    setOutboundPhase,
    setTyping,
  ]);

  const scheduleReadDelay = useCallback(() => {
    clearReadDelayTimer();
    readDelayTimerRef.current = setTimeout(() => {
      void flush();
    }, randomReadDelayMs());
  }, [clearReadDelayTimer, flush]);

  const startMaxWaitIfNeeded = useCallback(() => {
    if (firstEnqueueAtRef.current !== null) return;

    firstEnqueueAtRef.current = Date.now();
    maxWaitTimerRef.current = setTimeout(() => {
      void flush();
    }, MAX_OUTBOUND_WAIT_MS);
  }, [flush]);

  const interruptIfNeeded = useCallback(() => {
    const phase = useChatSessionStore.getState().outboundPhase;
    if (phase === 'playingReply') {
      playback.cancelPlayback();
    }
  }, [playback]);

  const enqueue = useCallback(
    (input: PhoneMessageInput, optimisticId: string) => {
      interruptIfNeeded();
      resetFollowUpConsumed(characterId);

      queueRef.current.push(input);
      pendingLocalIdsRef.current.push(optimisticId);

      setTyping(true);
      setOutboundPhase('queuing');
      startMaxWaitIfNeeded();
      scheduleReadDelay();

      if (queueRef.current.length >= MAX_OUTBOUND_MESSAGES) {
        void flush();
      }
    },
    [
      characterId,
      flush,
      interruptIfNeeded,
      scheduleReadDelay,
      setOutboundPhase,
      setTyping,
      startMaxWaitIfNeeded,
    ],
  );

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const optimistic = createOptimisticTextMessage(trimmed);
      appendMessage(optimistic);
      enqueue({ msg_type: 'text', text: { text: trimmed } }, optimistic.id);
    },
    [appendMessage, enqueue],
  );

  const sendEmoji = useCallback(
    (emoji: EmojiItem) => {
      const description = getEmojiLabel(emoji);
      const optimistic = createOptimisticEmojiMessage({
        emoji_id: emoji.emoji_id,
        media: { url: emoji.media.url },
        description,
      });
      appendMessage(optimistic);
      enqueue(
        {
          msg_type: 'emoji',
          emoji: {
            emoji_id: emoji.emoji_id,
            media: emoji.media,
          },
        },
        optimistic.id,
      );
    },
    [appendMessage, enqueue],
  );

  const sendImage = useCallback(
    (imageUrl: string) => {
      const trimmed = imageUrl.trim();
      if (!trimmed) return;

      const optimistic = createOptimisticImageMessage({ url: trimmed });
      appendMessage(optimistic);
      enqueue(
        {
          msg_type: 'image',
          image: {
            image: {
              id: '',
              url: trimmed,
              media_type: 'image',
            },
          },
        },
        optimistic.id,
      );
    },
    [appendMessage, enqueue],
  );

  const sendVoice = useCallback(
    async (input: { uri: string; transcript?: string; durationMs?: number }) => {
      const { transcript, voice } = await transcribeVoice(input);
      const durationSec = userVoiceDisplaySecFromTranscript(transcript);

      const optimistic = createOptimisticVoiceMessage({
        durationSec,
        voiceUrl: voice.url ?? '',
        transcript,
      });
      appendMessage(optimistic);
      enqueue(
        {
          msg_type: 'voice',
          voice: {
            voice,
            text: transcript,
          },
        },
        optimistic.id,
      );
    },
    [appendMessage, enqueue],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (queueRef.current.length > 0) {
        void flush();
        return;
      }
      resetQueueTimers();
    };
  }, [flush, resetQueueTimers]);

  return { sendText, sendEmoji, sendImage, sendVoice };
}
