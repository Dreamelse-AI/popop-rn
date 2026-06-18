import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';

import { takePendingForward } from '@/features/share';
import type { EmojiItem } from '@/generated/arca_apiComponents';
import { useToast } from '@/shared/ui/toast';

import {
  getImageUploadErrorMessage,
  pickAndUploadImages,
} from '../lib/pick-and-upload-images';

import { markEmojiUsed, updateMessageClickStatus } from '../api/chat-api';
import type { ChatMessage } from '../model/types';
import { useChatSessionStore } from '../store/chat-session-store';

import { useCharacterVersionSync } from './use-character-version-sync';
import { useChatHistory } from './use-chat-history';
import { useChatScroll } from './use-chat-scroll';
import { useChatSession } from './use-chat-session';
import { useEmojiPanel } from './use-emoji-panel';
import { useFollowUpReply } from './use-follow-up-reply';
import { useMessagePolling } from './use-message-polling';
import { useMessageRollback } from './use-message-rollback';
import { useOutboundQueue } from './use-outbound-queue';
import { useReFriendGreeting } from './use-re-friend-greeting';
import { useReplyPlayback } from './use-reply-playback';
import { useVoicePlayback } from './use-voice-playback';
import { useVoiceRecorder } from './use-voice-recorder';

export type CharacterChatActions = {
  onBack: () => void;
  onOpenProfile: (characterId: string) => void;
};

export function useCharacterChat(characterId: string, actions: CharacterChatActions) {
  const { t } = useTranslation();
  const session = useChatSession(characterId);
  const playback = useReplyPlayback();
  const { toast, showToast } = useToast();
  const outbound = useOutboundQueue(characterId, playback, {
    onSendFailed: () => showToast('发送失败，请稍后重试'),
  });
  useMessagePolling(
    characterId,
    Boolean(characterId) && !session.isLoadingCharacter && !session.isLoadingHistory,
  );
  useFollowUpReply();
  useReFriendGreeting(
    characterId,
    session.isLoadingHistory,
    Boolean(session.character),
    playback,
  );
  const voiceRecorder = useVoiceRecorder();
  const voicePlayback = useVoicePlayback();
  const rollback = useMessageRollback(characterId, playback);
  const versionSync = useCharacterVersionSync({
    characterId,
    isLoadingHistory: session.isLoadingHistory,
    hasCharacter: Boolean(session.character),
    friendVersionInfo: session.friendVersionInfo,
    hasChatHistory: session.messages.some(message => message.type !== 'timestamp'),
  });

  const setShowEmojiPanel = useChatSessionStore(s => s.setShowEmojiPanel);
  const setRollbackDraft = useChatSessionStore(s => s.setRollbackDraft);
  const markVoiceRead = useChatSessionStore(s => s.markVoiceRead);
  const revealVoiceTranscript = useChatSessionStore(s => s.revealVoiceTranscript);

  const { emojiPanel, loading: emojiLoading, fetchFailed: emojiFetchFailed, retry: retryEmojiLoad } =
    useEmojiPanel(session.showEmojiPanel);
  const { loadOlderHistory } = useChatHistory(characterId);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const { onScroll, onContentSizeChange, onLayout, onScrollToIndexFailed } = useChatScroll({
    characterId,
    listRef,
    messages: session.messages,
    isTyping: session.isTyping,
    isLoadingCharacter: session.isLoadingCharacter,
    isLoadingHistory: session.isLoadingHistory,
    isLoadingOlderHistory: session.isLoadingOlderHistory,
    historyUpHasMore: session.historyUpHasMore,
    onLoadOlder: loadOlderHistory,
  });

  const pendingForwardSentRef = useRef(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pendingForwardSentRef.current) return;
    if (!session.character || session.isLoadingHistory) return;

    const pending = takePendingForward(characterId);
    if (!pending) return;

    pendingForwardSentRef.current = true;
    outbound.sendText(pending);
  }, [characterId, outbound, session.character, session.isLoadingHistory]);

  const handleSendText = useCallback(
    (text: string) => {
      outbound.sendText(text);
    },
    [outbound],
  );

  const handleSendImage = useCallback(
    (imageUrl: string) => {
      outbound.sendImage(imageUrl);
    },
    [outbound],
  );

  const handlePickImages = useCallback(async () => {
    try {
      const results = await pickAndUploadImages({ scene: 'chat' });
      for (const result of results) {
        handleSendImage(result.imageUrl);
      }
    } catch (error) {
      showToast(getImageUploadErrorMessage(error, t));
    }
  }, [handleSendImage, showToast, t]);

  const handleEmojiSelect = useCallback(
    (emoji: EmojiItem) => {
      outbound.sendEmoji(emoji);
      setShowEmojiPanel(false);
      void markEmojiUsed({
        emoji_id: emoji.emoji_id,
        source: emoji.source,
        pack_id: emoji.pack_id,
      }).catch(() => {
        // 与发送解耦，失败不影响聊天
      });
    },
    [outbound, setShowEmojiPanel],
  );

  const toggleEmojiPanel = useCallback(() => {
    setShowEmojiPanel(!useChatSessionStore.getState().showEmojiPanel);
  }, [setShowEmojiPanel]);

  const openProfile = useCallback(() => {
    if (session.character) actions.onOpenProfile(session.character.id);
  }, [actions, session.character]);

  const handleCharacterVoicePress = useCallback(
    (message: Extract<ChatMessage, { type: 'voice' }>) => {
      if (!message.voiceUrl) return;
      voicePlayback.play(message.id, message.voiceUrl);

      if (!message.unread) return;

      markVoiceRead(message.id);

      const msgId = message.serverMessageId ?? message.id;
      void updateMessageClickStatus({
        character_id: characterId,
        msg_id: msgId,
        is_click: true,
      });
    },
    [characterId, markVoiceRead, voicePlayback],
  );

  const handleUserVoicePress = useCallback(
    (message: Extract<ChatMessage, { type: 'voice' }>) => {
      if (message.transcriptRevealed) return;
      revealVoiceTranscript(message.id);
    },
    [revealVoiceTranscript],
  );

  const handleVoiceHoldStart = useCallback(
    (clientY: number) => {
      void voiceRecorder.startRecording(clientY);
    },
    [voiceRecorder],
  );

  const handleVoiceHoldMove = useCallback(
    (clientY: number) => {
      voiceRecorder.updatePointer(clientY);
    },
    [voiceRecorder],
  );

  const handleVoiceHoldEnd = useCallback(async () => {
    const result = await voiceRecorder.finishRecording();
    if (!result) return;

    const transcript = result.transcript.trim();
    if (transcript) {
      outbound.sendText(transcript);
      return;
    }

    await outbound.sendVoice({
      uri: result.uri,
      durationMs: result.durationMs,
    });
  }, [outbound, voiceRecorder]);

  const handleFailedMessagePress = useCallback(
    (message: ChatMessage) => {
      void outbound.resendFailedMessage(message);
    },
    [outbound],
  );

  const handleImagePress = useCallback((url: string) => {
    setPreviewImageUrl(url);
  }, []);

  return {
    character: session.character,
    isLoading: session.isLoadingCharacter,
    listRef,
    toast,
    previewImageUrl,
    onPreviewImageClose: () => setPreviewImageUrl(null),
    screen: session.character
      ? {
          listRef,
          onScroll,
          onContentSizeChange,
          onLayout,
          onScrollToIndexFailed,
          character: session.character,
          characterAka: session.characterAka,
          messages: session.messages,
          isTyping: session.isTyping,
          isLoadingHistory: session.isLoadingHistory,
          isLoadingOlderHistory: session.isLoadingOlderHistory,
          historyUpHasMore: session.historyUpHasMore,
          showEmojiPanel: session.showEmojiPanel,
          emojiPanel,
          emojiLoading,
          emojiFetchFailed,
          onEmojiRetry: retryEmojiLoad,
          draft: session.rollbackDraft,
          playingVoiceId: voicePlayback.playingMessageId,
          voiceRecorderPhase: voiceRecorder.phase,
          voicePermissionDenied: voiceRecorder.permissionDenied,
          voiceIsCancelled: voiceRecorder.isCancelled,
          voicePressTooShort: voiceRecorder.isPressTooShort,
          voiceCancelZone: voiceRecorder.cancelZone,
          voiceInterimTranscript: voiceRecorder.interimTranscript,
          onBack: actions.onBack,
          onProfilePress: openProfile,
          onSendText: handleSendText,
          onPickImages: handlePickImages,
          onToggleEmojiPanel: toggleEmojiPanel,
          onEmojiSelect: handleEmojiSelect,
          onEmojiPanelClose: () => setShowEmojiPanel(false),
          onDraftChange: setRollbackDraft,
          onCharacterVoicePress: handleCharacterVoicePress,
          onUserVoicePress: handleUserVoicePress,
          onVoiceHoldStart: handleVoiceHoldStart,
          onVoiceHoldMove: handleVoiceHoldMove,
          onVoiceHoldEnd: handleVoiceHoldEnd,
          onMessageLongPress: rollback.openMenu,
          onImagePress: handleImagePress,
          onFailedMessagePress: handleFailedMessagePress,
          rollbackMenuOpen: Boolean(rollback.menuTarget),
          rollbackCanCopy: Boolean(rollback.menuCopyText),
          rollbackCanRollback: rollback.canRollback,
          onRollbackMenuClose: rollback.closeMenu,
          onRollbackCopy: () => {
            if (rollback.menuTarget) void rollback.handleCopy(rollback.menuTarget);
          },
          onRollbackRequest: () => {
            if (rollback.menuTarget) rollback.requestRollback(rollback.menuTarget);
          },
          rollbackConfirmOpen: Boolean(rollback.confirmTarget),
          rollbackConfirmLoading: rollback.isRollingBack,
          onRollbackConfirmClose: rollback.cancelConfirm,
          onRollbackConfirm: () => void rollback.confirmRollback(),
          versionSyncDialogOpen: versionSync.versionSyncDialogOpen,
          versionSyncUpdating: versionSync.versionSyncUpdating,
          onVersionSyncUpdate: () => void versionSync.onVersionSyncUpdate(),
          onVersionSyncDismiss: versionSync.onVersionSyncDismiss,
          onVersionSyncClose: versionSync.onVersionSyncClose,
        }
      : null,
  };
}
