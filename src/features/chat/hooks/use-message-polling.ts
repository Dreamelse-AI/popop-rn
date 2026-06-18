import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { listCharacterPhoneChatHistory } from '../api/chat-api';
import { HISTORY_PAGE_SIZE, POLL_NEW_MESSAGES_INTERVAL_MS } from '../config/chat-config';
import { markCharacterMessagesReadFromOutputs } from '../lib/mark-messages-read';
import {
  collectExistingCursors,
  filterPhoneMessagesForNewerPage,
  phoneMessagesToDisplayList,
  resolvePollingAnchorCursor,
} from '../lib/phone-message-adapter';
import { useChatSessionStore } from '../store/chat-session-store';

function shouldSkipPolling(): boolean {
  const state = useChatSessionStore.getState();
  if (state.isLoadingHistory || state.isLoadingOlderHistory) return true;
  return state.outboundPhase === 'playingReply' || state.outboundPhase === 'awaitingApi';
}

/** 定时轮询 direction=down 的新消息 */
export function useMessagePolling(characterId: string, enabled: boolean) {
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!characterId || !enabled) return;

    const poll = async () => {
      if (pollingRef.current) return;

      const state = useChatSessionStore.getState();
      if (state.characterId !== characterId) return;
      if (shouldSkipPolling()) return;

      const anchorCursor = resolvePollingAnchorCursor({
        messages: state.messages,
        historyMaxCursor: state.historyMaxCursor,
      });

      pollingRef.current = true;

      try {
        const resp = await listCharacterPhoneChatHistory({
          character_id: characterId,
          cursor: anchorCursor,
          direction: 'down',
          limit: HISTORY_PAGE_SIZE,
        });

        const current = useChatSessionStore.getState();
        if (current.characterId !== characterId) return;

        if (resp.msgs.length > 0) {
          const emojiDescriptions = current.emojiDescriptions;
          const existingCursors = collectExistingCursors(current.messages);
          const newerOutputs = filterPhoneMessagesForNewerPage(
            resp.msgs,
            anchorCursor,
            existingCursors,
          );

          if (newerOutputs.length > 0) {
            const newerMessages = phoneMessagesToDisplayList(newerOutputs, { emojiDescriptions });
            useChatSessionStore.getState().appendNewerMessages(newerMessages);
            markCharacterMessagesReadFromOutputs(characterId, newerOutputs);
          }
        }

        useChatSessionStore.getState().setHistoryPagination({
          minCursor: current.historyMinCursor ?? resp.min_cursor,
          maxCursor: resp.max_cursor,
          upHasMore: current.historyUpHasMore,
          downHasMore: resp.down_has_more,
        });
      } catch {
        // 轮询失败静默忽略，下次重试
      } finally {
        pollingRef.current = false;
      }
    };

    void poll();

    const timer = setInterval(() => {
      void poll();
    }, POLL_NEW_MESSAGES_INTERVAL_MS);

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void poll();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [characterId, enabled]);
}
