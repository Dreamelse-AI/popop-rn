import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import type { PhoneMessageInput } from '@/generated/arca_apiComponents';

import { chatWithCharacter } from '../api/chat-api';
import {
  MAX_OUTBOUND_MESSAGES,
  MAX_OUTBOUND_WAIT_MS,
  READ_DELAY_MS,
  clampChatText,
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
  hasVisibleReplyContent,
  toPhoneMessageInput,
} from '../lib/phone-message-adapter';
import { extractUserRollbackDraft } from '../lib/message-rollback';
import { deliverCharacterRepliesImmediately } from '../lib/reply-delivery';
import { isActiveChatSession } from '../lib/session-guard';
import { transcribeVoice, userVoiceDisplaySecFromTranscript } from '../api/voice-api';
import type { ChatMessage } from '../model/types';
import { useChatSessionStore } from '../store/chat-session-store';
import { runPaidAction } from '@/shared/wallet';
import {
  API_CODE,
  ApiError,
  isChatContentAuditError,
} from '@/shared/api/api-errors';

import type { ReplyPlaybackControls } from './use-reply-playback';

type OutboundQueueOptions = {
  onSendFailed?: (error: unknown) => void;
};

function isResendableMessage(
  message: ChatMessage,
): message is Extract<
  ChatMessage,
  { type: 'text' | 'emoji' | 'image' | 'voice'; status?: 'pending' | 'failed' }
> {
  if (!('status' in message) || message.status !== 'failed') return false;

  if (message.type === 'text' || message.type === 'emoji' || message.type === 'image') {
    return true;
  }

  if (message.type === 'voice') {
    return Boolean(message.voiceUrl);
  }

  return false;
}

function randomReadDelayMs() {
  const { min, max } = READ_DELAY_MS;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 从即将被删除的 optimistic 气泡中取回原文，用于回填输入框 */
function extractAuditRollbackDraft(pendingIds: string[]): string {
  const messages = useChatSessionStore.getState().messages;
  for (const localId of pendingIds) {
    const message = messages.find(item => item.id === localId);
    if (!message) continue;
    const draft = extractUserRollbackDraft(message);
    if (draft) return draft;
  }
  return '';
}

/** 等待两帧再执行，避免「回填输入框」与「删除气泡」同帧造成闪烁 */
function runAfterNextPaint(run: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

export function useOutboundQueue(
  characterId: string,
  playback: ReplyPlaybackControls,
  options: OutboundQueueOptions = {},
) {
  const appendMessage = useChatSessionStore(s => s.appendMessage);
  const applyApiCurrentMessages = useChatSessionStore(s => s.applyApiCurrentMessages);
  const clearPendingByLocalIds = useChatSessionStore(s => s.clearPendingByLocalIds);
  const markPendingByLocalIds = useChatSessionStore(s => s.markPendingByLocalIds);
  const markMessagesAsFailed = useChatSessionStore(s => s.markMessagesAsFailed);
  const removeMessageById = useChatSessionStore(s => s.removeMessageById);
  const setRollbackDraft = useChatSessionStore(s => s.setRollbackDraft);
  const setTyping = useChatSessionStore(s => s.setTyping);
  const setOutboundPhase = useChatSessionStore(s => s.setOutboundPhase);
  const setCharacterStatus = useChatSessionStore(s => s.setCharacterStatus);

  const onSendFailedRef = useRef(options.onSendFailed);
  onSendFailedRef.current = options.onSendFailed;

  const queueRef = useRef<PhoneMessageInput[]>([]);
  const pendingLocalIdsRef = useRef<string[]>([]);
  const readDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const sendImmediate = useCallback(
    async (messages: PhoneMessageInput[], pendingIds: string[], resendMessageId?: string) => {
      if (flushingRef.current) return;
      flushingRef.current = true;
      resetQueueTimers();

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
              ...(resendMessageId ? { resend_message_id: resendMessageId } : {}),
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
        // 角色返回空回复（无可展示内容）时，服务端可能仍标记 is_failed，
        // 此时不应给用户消息显示红色感叹号，这是正常现象。
        const hasVisibleReply = hasVisibleReplyContent(resp.character_messages);
        applyApiCurrentMessages(resp.current_messages, pendingIds, {
          ignoreServerFailed: !hasVisibleReply,
        });
        clearPendingByLocalIds(pendingIds);
        setCharacterStatus(resp.character_status);

        if (hasCharacterReply) {
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
      } catch (error) {
        if (isActiveChatSession(characterId)) {
          if (isChatContentAuditError(error)) {
            const draft =
              error.status === API_CODE.CHAT_TEXT_AUDIT_FAILED
                ? extractAuditRollbackDraft(pendingIds)
                : '';

            const removeBubbles = () => {
              for (const localId of pendingIds) {
                removeMessageById(localId);
              }
            };

            const finishAuditFailure = () => {
              setTyping(false);
              setOutboundPhase('idle');
              onSendFailedRef.current?.(error);
            };

            if (draft) {
              setRollbackDraft(draft);
              runAfterNextPaint(() => {
                removeBubbles();
                runAfterNextPaint(finishAuditFailure);
              });
            } else {
              removeBubbles();
              finishAuditFailure();
            }
          } else {
            markMessagesAsFailed(pendingIds);
            setTyping(false);
            setOutboundPhase('idle');
            onSendFailedRef.current?.(error);
          }
        }
      } finally {
        flushingRef.current = false;
      }
    },
    [
      applyApiCurrentMessages,
      characterId,
      clearPendingByLocalIds,
      markPendingByLocalIds,
      markMessagesAsFailed,
      playback,
      removeMessageById,
      resetQueueTimers,
      setCharacterStatus,
      setOutboundPhase,
      setRollbackDraft,
      setTyping,
    ],
  );

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    if (queueRef.current.length === 0) return;

    const messages = queueRef.current.splice(0);
    const pendingIds = pendingLocalIdsRef.current.splice(0);
    await sendImmediate(messages, pendingIds);
  }, [sendImmediate]);

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

  /**
   * 用户继续输入 / 收起键盘时重置「脑内判断」读延时。
   * 仅当已有排队消息时生效：
   * - 输入中不断 bump → 把已发出的消息与后续输入合并，避免半句就触发回复；
   * - 收起键盘后调用 → 从此刻重新计时，确保卡住的消息能发出去。
   * 注意：不重置 maxWait（最长等待 60s），即便一直输入也会兜底 flush。
   */
  const bumpReadDelayIfQueued = useCallback(() => {
    if (queueRef.current.length === 0) return;
    scheduleReadDelay();
  }, [scheduleReadDelay]);

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
      const trimmed = clampChatText(text.trim());
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

  const resendFailedMessage = useCallback(
    async (message: ChatMessage) => {
      if (!isResendableMessage(message)) return;

      const input = toPhoneMessageInput(message);
      if (!input) return;

      interruptIfNeeded();
      resetFollowUpConsumed(characterId);
      removeMessageById(message.id);

      let optimistic: ChatMessage;
      switch (message.type) {
        case 'text':
          optimistic = createOptimisticTextMessage(message.text);
          break;
        case 'emoji':
          optimistic = createOptimisticEmojiMessage({
            emoji_id: message.emojiId,
            media: { url: message.url },
            description: message.description,
          });
          break;
        case 'image':
          optimistic = createOptimisticImageMessage({ url: message.url });
          break;
        case 'voice':
          optimistic = createOptimisticVoiceMessage({
            durationSec: message.durationSec,
            voiceUrl: message.voiceUrl ?? '',
            transcript: message.transcript,
          });
          break;
      }

      appendMessage(optimistic);
      await sendImmediate([input], [optimistic.id], message.serverMessageId);
    },
    [appendMessage, characterId, interruptIfNeeded, removeMessageById, sendImmediate],
  );

  useEffect(() => {
    mountedRef.current = true;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' && queueRef.current.length > 0) {
        void flush();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      mountedRef.current = false;
      subscription.remove();
      if (queueRef.current.length > 0) {
        void flush();
        return;
      }
      resetQueueTimers();
    };
  }, [flush, resetQueueTimers]);

  return { sendText, sendEmoji, sendImage, sendVoice, resendFailedMessage, bumpReadDelayIfQueued };
}
