import { useCallback, useEffect, useState } from 'react';

import { friendshipApi } from '@/features/friendship/api';

import {
  getCharacterDetail,
  listCharacterPhoneChatHistory,
  listEmojiPanel,
} from '../api/chat-api';
import { HISTORY_PAGE_SIZE } from '../config/chat-config';
import {
  buildEmojiDescriptionMap,
  mapCharacterDetailToChatCharacter,
} from '../lib/character-adapter';
import { flattenEmojiPanel } from '../lib/emoji-panel-utils';
import { readEmojiPanelSession, writeEmojiPanelSession } from '../lib/emoji-panel-session';
import { restoreFollowUpConsumed } from '../lib/follow-up-scheduler';
import {
  clearMountedChatCharacter,
  setMountedChatCharacter,
} from '../lib/chat-screen-presence';
import { markCharacterMessagesReadFromOutputs } from '../lib/mark-messages-read';
import { getLatestCursorFromMessages, phoneMessagesToDisplayList } from '../lib/phone-message-adapter';
import type { ChatCharacter, ChatMessage } from '../model/types';
import { useChatSessionStore } from '../store/chat-session-store';

import type { FriendVersionInfo } from './use-character-version-sync';

/** store 中是否有「正在等待回复」的会话需要保留（用户消息仍 pending 或角色输入中） */
function hasUnsettledOutbound(messages: ChatMessage[]): boolean {
  return messages.some(m => 'status' in m && m.status === 'pending');
}

export function useChatSession(characterId: string) {
  const [character, setCharacter] = useState<ChatCharacter | null>(null);
  const [characterAka, setCharacterAka] = useState('');
  const [friendVersionInfo, setFriendVersionInfo] = useState<FriendVersionInfo | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(true);

  const initSession = useChatSessionStore(s => s.initSession);
  const setFriendshipId = useChatSessionStore(s => s.setFriendshipId);
  const setMessages = useChatSessionStore(s => s.setMessages);
  const setLoadingHistory = useChatSessionStore(s => s.setLoadingHistory);
  const setHistoryPagination = useChatSessionStore(s => s.setHistoryPagination);
  const setCharacterStatus = useChatSessionStore(s => s.setCharacterStatus);
  const setEmojiDescriptions = useChatSessionStore(s => s.setEmojiDescriptions);
  const setEmojiList = useChatSessionStore(s => s.setEmojiList);
  const setEmojiPanel = useChatSessionStore(s => s.setEmojiPanel);

  const messages = useChatSessionStore(s => s.messages);
  const isTyping = useChatSessionStore(s => s.isTyping);
  const isLoadingHistory = useChatSessionStore(s => s.isLoadingHistory);
  const isLoadingOlderHistory = useChatSessionStore(s => s.isLoadingOlderHistory);
  const historyUpHasMore = useChatSessionStore(s => s.historyUpHasMore);
  const characterStatus = useChatSessionStore(s => s.characterStatus);
  const showEmojiPanel = useChatSessionStore(s => s.showEmojiPanel);
  const rollbackDraft = useChatSessionStore(s => s.rollbackDraft);
  const setShowEmojiPanel = useChatSessionStore(s => s.setShowEmojiPanel);

  useEffect(() => {
    if (!characterId) return;

    // 回到「刚离开、仍在等回复」的同一会话：保留内存中的消息与「输入中」状态，
    // 不重置、不重拉历史。进行中的发送请求拿到回复后会自行写回 store。
    const prev = useChatSessionStore.getState();
    const preserveInMemory =
      prev.characterId === characterId &&
      (prev.isTyping || hasUnsettledOutbound(prev.messages));

    if (!preserveInMemory) {
      initSession(characterId);
    }
    restoreFollowUpConsumed(characterId);
    setCharacter(null);
    setCharacterAka('');
    setFriendVersionInfo(null);
    setIsLoadingCharacter(true);

    let cancelled = false;

    (async () => {
      const cachedEmojiPanel = readEmojiPanelSession();

      try {
        const [detailResp, historyResp, panelResult, friendshipResp] = await Promise.all([
          getCharacterDetail({ character_id: characterId, source: 'direct' }),
          listCharacterPhoneChatHistory({ character_id: characterId, limit: HISTORY_PAGE_SIZE }),
          cachedEmojiPanel ? Promise.resolve(cachedEmojiPanel) : listEmojiPanel().catch(() => null),
          friendshipApi.listFriends(),
        ]);
        if (cancelled) return;

        const friend = friendshipResp.friends.find(item => item.character_id === characterId);
        setFriendshipId(friend?.friendship_id ?? null);
        setCharacterAka(friend?.aka ?? '');
        setFriendVersionInfo(
          friend
            ? {
                characterSaveId: friend.current_character_save_id,
                currentVersionNo: friend.current_character_version_no,
                latestVersionNo: friend.latest_character_version_no,
              }
            : null,
        );

        const panelEmojis = panelResult ? flattenEmojiPanel(panelResult) : [];
        const emojiDescriptions = buildEmojiDescriptionMap(panelEmojis);
        setEmojiDescriptions(emojiDescriptions);
        setEmojiList(panelEmojis);
        if (panelResult) {
          setEmojiPanel(panelResult);
          if (!cachedEmojiPanel) writeEmojiPanelSession(panelResult);
        }
        setCharacter(mapCharacterDetailToChatCharacter(detailResp.character));

        // 保留态：内存里的消息/输入中即离开前的状态，不用历史覆盖。
        if (!preserveInMemory) {
          const displayMessages = phoneMessagesToDisplayList(historyResp.msgs, { emojiDescriptions });
          setMessages(displayMessages);
          setHistoryPagination({
            minCursor: historyResp.min_cursor,
            maxCursor: historyResp.max_cursor,
            upHasMore: historyResp.up_has_more,
            downHasMore: historyResp.down_has_more,
          });
          markCharacterMessagesReadFromOutputs(characterId, historyResp.msgs);
        } else {
          const maxCursor =
            getLatestCursorFromMessages(prev.messages) ?? prev.historyMaxCursor ?? '0';
          setHistoryPagination({
            minCursor: prev.historyMinCursor ?? maxCursor,
            maxCursor,
            upHasMore: prev.historyUpHasMore,
            downHasMore: prev.historyDownHasMore,
          });
        }
      } catch {
        if (!cancelled && !preserveInMemory) {
          setCharacter(null);
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCharacter(false);
          setLoadingHistory(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    characterId,
    initSession,
    setFriendshipId,
    setCharacterStatus,
    setEmojiDescriptions,
    setEmojiList,
    setEmojiPanel,
    setHistoryPagination,
    setLoadingHistory,
    setMessages,
  ]);

  const sceneTag = characterAka;

  // 标记当前展示的聊天角色：供在途发送请求判断是否应逐条播放回复
  useEffect(() => {
    if (!characterId) return;
    setMountedChatCharacter(characterId);
    return () => clearMountedChatCharacter(characterId);
  }, [characterId]);

  const toggleEmojiPanel = useCallback(() => {
    setShowEmojiPanel(!useChatSessionStore.getState().showEmojiPanel);
  }, [setShowEmojiPanel]);

  return {
    character,
    isLoadingCharacter,
    messages,
    isTyping,
    isLoadingHistory,
    isLoadingOlderHistory,
    historyUpHasMore,
    characterStatus,
    characterAka,
    friendVersionInfo,
    sceneTag,
    showEmojiPanel,
    rollbackDraft,
    setShowEmojiPanel,
    toggleEmojiPanel,
    setCharacterStatus,
  };
}
