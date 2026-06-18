import { useCallback } from 'react';

import { listCharacterPhoneChatHistory } from '../api/chat-api';
import { HISTORY_PAGE_SIZE } from '../config/chat-config';
import {
  collectExistingCursors,
  filterPhoneMessagesForOlderPage,
  phoneMessagesToDisplayList,
} from '../lib/phone-message-adapter';
import { useChatSessionStore } from '../store/chat-session-store';

export function useChatHistory(characterId: string) {
  const setHistoryPagination = useChatSessionStore(s => s.setHistoryPagination);
  const setLoadingOlderHistory = useChatSessionStore(s => s.setLoadingOlderHistory);
  const prependMessages = useChatSessionStore(s => s.prependMessages);

  const loadOlderHistory = useCallback(async (): Promise<boolean> => {
    const state = useChatSessionStore.getState();
    if (
      !characterId ||
      !state.historyUpHasMore ||
      state.isLoadingOlderHistory ||
      !state.historyMinCursor
    ) {
      return false;
    }

    setLoadingOlderHistory(true);

    try {
      const resp = await listCharacterPhoneChatHistory({
        character_id: characterId,
        cursor: state.historyMinCursor,
        direction: 'up',
        limit: HISTORY_PAGE_SIZE,
      });

      if (resp.msgs.length === 0) {
        setHistoryPagination({
          minCursor: state.historyMinCursor ?? resp.min_cursor,
          maxCursor: state.historyMaxCursor ?? resp.max_cursor,
          upHasMore: false,
          downHasMore: resp.down_has_more,
        });
        return false;
      }

      const emojiDescriptions = useChatSessionStore.getState().emojiDescriptions;
      const existingCursors = collectExistingCursors(state.messages);
      const olderOutputs = filterPhoneMessagesForOlderPage(
        resp.msgs,
        state.historyMinCursor,
        existingCursors,
      );

      if (olderOutputs.length === 0) {
        setHistoryPagination({
          minCursor: resp.min_cursor,
          maxCursor: state.historyMaxCursor ?? resp.max_cursor,
          upHasMore: resp.up_has_more,
          downHasMore: state.historyDownHasMore,
        });
        return false;
      }

      const olderMessages = phoneMessagesToDisplayList(olderOutputs, { emojiDescriptions });
      prependMessages(olderMessages);
      setHistoryPagination({
        minCursor: resp.min_cursor,
        maxCursor: state.historyMaxCursor ?? resp.max_cursor,
        upHasMore: resp.up_has_more,
        downHasMore: state.historyDownHasMore,
      });
      return true;
    } catch {
      return false;
    } finally {
      setLoadingOlderHistory(false);
    }
  }, [characterId, prependMessages, setHistoryPagination, setLoadingOlderHistory]);

  return { loadOlderHistory };
}
