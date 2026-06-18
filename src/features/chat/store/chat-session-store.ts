import type {
  CharacterStatus,
  EmojiItem,
  ListEmojiPanelResp,
  PhoneMessageOutput,
} from '@/generated/arca_apiComponents';
import { create } from 'zustand';

import {
  applyCurrentMessages,
  clearPendingByLocalIds,
  injectTimestampSeparators,
  markPendingByLocalIds,
  maxMessageCursor,
  mergeNewerDisplayMessages,
  mergeOlderDisplayMessages,
  stripTimestampSeparators,
} from '../lib/phone-message-adapter';
import type { ChatMessage, OutboundPhase } from '../model/types';

interface ChatSessionState {
  characterId: string | null;
  friendshipId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  isLoadingHistory: boolean;
  isLoadingOlderHistory: boolean;
  historyMinCursor: string | null;
  historyMaxCursor: string | null;
  historyUpHasMore: boolean;
  historyDownHasMore: boolean;
  characterStatus: CharacterStatus | null;
  followUpConsumed: boolean;
  outboundPhase: OutboundPhase;
  showEmojiPanel: boolean;
  rollbackDraft: string;
  emojiList: EmojiItem[];
  emojiPanel: ListEmojiPanelResp | null;
  emojiDescriptions: Map<string, string>;

  initSession: (characterId: string) => void;
  setFriendshipId: (friendshipId: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  appendMessages: (messages: ChatMessage[]) => void;
  applyApiCurrentMessages: (
    currentMessages: PhoneMessageOutput[],
    pendingLocalIds: string[],
    options?: { ignoreServerFailed?: boolean },
  ) => void;
  clearPendingByLocalIds: (pendingLocalIds: string[]) => void;
  markPendingByLocalIds: (pendingLocalIds: string[]) => void;
  markMessagesAsFailed: (localIds: string[]) => void;
  setTyping: (value: boolean) => void;
  setLoadingHistory: (value: boolean) => void;
  setLoadingOlderHistory: (value: boolean) => void;
  setHistoryPagination: (pagination: {
    minCursor: string;
    maxCursor: string;
    upHasMore: boolean;
    downHasMore?: boolean;
  }) => void;
  prependMessages: (messages: ChatMessage[]) => void;
  appendNewerMessages: (messages: ChatMessage[]) => void;
  setCharacterStatus: (status: CharacterStatus | null) => void;
  setOutboundPhase: (phase: OutboundPhase) => void;
  setShowEmojiPanel: (value: boolean) => void;
  setRollbackDraft: (value: string) => void;
  setEmojiList: (emojis: EmojiItem[]) => void;
  setEmojiPanel: (panel: ListEmojiPanelResp | null) => void;
  setEmojiDescriptions: (map: Map<string, string>) => void;
  resetFollowUpConsumed: () => void;
  markFollowUpConsumed: () => void;
  markVoiceRead: (messageId: string) => void;
  revealVoiceTranscript: (messageId: string) => void;
  removeMessageById: (messageId: string) => void;
}

export const useChatSessionStore = create<ChatSessionState>(set => ({
  characterId: null,
  friendshipId: null,
  messages: [],
  isTyping: false,
  isLoadingHistory: false,
  isLoadingOlderHistory: false,
  historyMinCursor: null,
  historyMaxCursor: null,
  historyUpHasMore: false,
  historyDownHasMore: false,
  characterStatus: null,
  followUpConsumed: false,
  outboundPhase: 'idle',
  showEmojiPanel: false,
  rollbackDraft: '',
  emojiList: [],
  emojiPanel: null,
  emojiDescriptions: new Map(),

  initSession: characterId =>
    set({
      characterId,
      friendshipId: null,
      messages: [],
      isTyping: false,
      isLoadingHistory: true,
      isLoadingOlderHistory: false,
      historyMinCursor: null,
      historyMaxCursor: null,
      historyUpHasMore: false,
      historyDownHasMore: false,
      characterStatus: null,
      followUpConsumed: false,
      outboundPhase: 'idle',
      showEmojiPanel: false,
      rollbackDraft: '',
      emojiList: [],
      emojiPanel: null,
      emojiDescriptions: new Map(),
    }),

  setFriendshipId: friendshipId => set({ friendshipId }),

  setMessages: messages => set({ messages }),

  appendMessage: message =>
    set(state => ({
      messages: [...state.messages, message],
      historyMaxCursor:
        'cursor' in message && message.cursor
          ? maxMessageCursor(state.historyMaxCursor, message.cursor)
          : state.historyMaxCursor,
    })),

  appendMessages: messages =>
    set(state => {
      let historyMaxCursor = state.historyMaxCursor;
      for (const message of messages) {
        if ('cursor' in message && message.cursor) {
          historyMaxCursor = maxMessageCursor(historyMaxCursor, message.cursor);
        }
      }
      return {
        messages: [...state.messages, ...messages],
        historyMaxCursor,
      };
    }),

  applyApiCurrentMessages: (currentMessages, pendingLocalIds, options) =>
    set(state => {
      const messages = applyCurrentMessages(
        state.messages,
        currentMessages,
        pendingLocalIds,
        options,
      );
      let historyMaxCursor = state.historyMaxCursor;
      for (const output of currentMessages) {
        if (output.cursor) {
          historyMaxCursor = maxMessageCursor(historyMaxCursor, output.cursor);
        }
      }
      return { messages, historyMaxCursor };
    }),

  clearPendingByLocalIds: pendingLocalIds =>
    set(state => ({
      messages: clearPendingByLocalIds(state.messages, pendingLocalIds),
    })),

  markPendingByLocalIds: pendingLocalIds =>
    set(state => ({
      messages: markPendingByLocalIds(state.messages, pendingLocalIds),
    })),

  markMessagesAsFailed: localIds =>
    set(state => ({
      messages: state.messages.map(msg => {
        if (!localIds.includes(msg.id)) return msg;
        if ('status' in msg && msg.status === 'pending') {
          return { ...msg, status: 'failed' as const };
        }
        return msg;
      }),
    })),

  setTyping: value => set({ isTyping: value }),
  setLoadingHistory: value => set({ isLoadingHistory: value }),
  setLoadingOlderHistory: value => set({ isLoadingOlderHistory: value }),
  setHistoryPagination: ({ minCursor, maxCursor, upHasMore, downHasMore = false }) =>
    set({
      historyMinCursor: minCursor,
      historyMaxCursor: maxCursor,
      historyUpHasMore: upHasMore,
      historyDownHasMore: downHasMore,
    }),
  prependMessages: messages =>
    set(state => ({
      messages: mergeOlderDisplayMessages(messages, state.messages),
    })),
  appendNewerMessages: messages =>
    set(state => {
      let historyMaxCursor = state.historyMaxCursor;
      for (const message of stripTimestampSeparators(messages)) {
        if ('cursor' in message && message.cursor) {
          historyMaxCursor = maxMessageCursor(historyMaxCursor, message.cursor);
        }
      }
      return {
        messages: mergeNewerDisplayMessages(state.messages, messages),
        historyMaxCursor,
      };
    }),
  setCharacterStatus: status => set({ characterStatus: status }),
  setOutboundPhase: phase => set({ outboundPhase: phase }),
  setShowEmojiPanel: value => set({ showEmojiPanel: value }),
  setRollbackDraft: value => set({ rollbackDraft: value }),
  setEmojiList: emojis => set({ emojiList: emojis }),
  setEmojiPanel: panel => set({ emojiPanel: panel }),
  setEmojiDescriptions: map => set({ emojiDescriptions: map }),
  resetFollowUpConsumed: () => set({ followUpConsumed: false }),
  markFollowUpConsumed: () => set({ followUpConsumed: true }),

  markVoiceRead: messageId =>
    set(state => ({
      messages: state.messages.map(message =>
        message.id === messageId && message.type === 'voice'
          ? { ...message, unread: false }
          : message,
      ),
    })),

  revealVoiceTranscript: messageId =>
    set(state => ({
      messages: state.messages.map(message =>
        message.id === messageId && message.type === 'voice'
          ? { ...message, transcriptRevealed: true }
          : message,
      ),
    })),

  removeMessageById: messageId =>
    set(state => ({
      messages: injectTimestampSeparators(
        stripTimestampSeparators(state.messages).filter(message => message.id !== messageId),
      ),
    })),
}));

export function useChatSessionSelector<T>(selector: (state: ChatSessionState) => T): T {
  return useChatSessionStore(selector);
}
