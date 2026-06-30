import { useState, type RefObject } from 'react'
import {
  View,
  Text,
  Pressable,
  Keyboard,
  StyleSheet,
  type FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'

import type { EmojiItem, ListEmojiPanelResp } from '@/generated/arca_apiComponents'

import { useChatAtmosphere } from '../hooks/use-chat-atmosphere'
import type { VoiceRecorderPhase, VoiceCancelZone } from '../hooks/use-voice-recorder'
import type { ChatCharacter, ChatMessage } from '../model/types'
import type { BubbleStyleTokens } from '../lib/chat-atmosphere-presets'

import { PopImage } from '@/shared/ui/pop-image'

import { ChatEmojiBottomSheet } from './chat-emoji-bottom-sheet'
import { ChatHeader } from './chat-header'
import { ChatInputBar, VoiceRecordingBanner, type ChatComposerInputMode } from './chat-input-bar'
import { ChatMessageContextMenu } from './chat-message-context-menu'
import { ChatMessageList } from './chat-message-list'
import { ChatNewMessageHint } from './chat-new-message-hint'
import { ChatCharacterVersionSyncDialog } from './chat-character-version-sync-dialog'
import { ChatRollbackConfirmDialog } from './chat-rollback-confirm-dialog'
import { ChatSettingsDrawer } from './chat-settings-drawer'

export type CharacterChatScreenProps = {
  listRef?: RefObject<FlatList<ChatMessage> | null>
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onContentSizeChange?: (w: number, h: number) => void
  onLayout?: (event: LayoutChangeEvent) => void
  onScrollToIndexFailed?: (info: { index: number; averageItemLength: number }) => void
  character: ChatCharacter
  characterAka: string
  messages: ChatMessage[]
  isTyping: boolean
  isLoadingHistory: boolean
  isLoadingOlderHistory?: boolean
  historyUpHasMore?: boolean
  showEmojiPanel: boolean
  emojiPanel: ListEmojiPanelResp | null
  emojiLoading: boolean
  emojiFetchFailed?: boolean
  onEmojiRetry?: () => void
  showNewMessageHint?: boolean
  newMessageCount?: number
  onJumpToLatest?: () => void
  draft: string
  playingVoiceId?: string | null
  voiceRecorderPhase?: VoiceRecorderPhase
  voicePermissionDenied?: boolean
  voiceIsCancelled?: boolean
  voicePressTooShort?: boolean
  voiceCancelZone?: VoiceCancelZone
  voiceHoldReleaseToken?: number
  voiceInterimTranscript?: string
  onBack: () => void
  onProfilePress: () => void
  onSendText: (text: string) => void
  onPickImages: () => void
  onToggleEmojiPanel: () => void
  onEmojiSelect: (emoji: EmojiItem) => void
  onEmojiPanelClose: () => void
  onDraftChange: (value: string) => void
  onComposerFocusChange?: (focused: boolean) => void
  onCharacterVoicePress?: (message: Extract<ChatMessage, { type: 'voice' }>) => void
  onUserVoicePress?: (message: Extract<ChatMessage, { type: 'voice' }>) => void
  onVoiceHoldStart?: (clientY: number) => void
  onVoiceHoldMove?: (clientY: number) => void
  onVoiceHoldEnd?: () => void
  onMessageLongPress?: (message: ChatMessage) => void
  onImagePress?: (url: string) => void
  onFailedMessagePress?: (message: ChatMessage) => void
  onShareCardPress?: (message: Extract<ChatMessage, { type: 'share_card' }>) => void
  onLinkCardPress?: (message: Extract<ChatMessage, { type: 'link_card' }>) => void
  rollbackMenuOpen?: boolean
  rollbackCanCopy?: boolean
  rollbackCanRollback?: boolean
  onRollbackMenuClose?: () => void
  onRollbackCopy?: () => void
  onRollbackRequest?: () => void
  rollbackConfirmOpen?: boolean
  rollbackConfirmLoading?: boolean
  onRollbackConfirmClose?: () => void
  onRollbackConfirm?: () => void
  versionSyncDialogOpen?: boolean
  versionSyncUpdating?: boolean
  onVersionSyncUpdate?: () => void
  onVersionSyncDismiss?: () => void
  onVersionSyncClose?: () => void
}

export function CharacterChatScreen({
  listRef,
  onScroll,
  onContentSizeChange,
  onLayout,
  onScrollToIndexFailed,
  character,
  characterAka,
  messages,
  isTyping,
  isLoadingHistory,
  isLoadingOlderHistory = false,
  historyUpHasMore = false,
  showEmojiPanel,
  emojiPanel,
  emojiLoading,
  emojiFetchFailed = false,
  onEmojiRetry,
  showNewMessageHint = false,
  newMessageCount = 0,
  onJumpToLatest,
  draft,
  playingVoiceId,
  voiceRecorderPhase = 'idle',
  voicePermissionDenied = false,
  voiceIsCancelled = false,
  voicePressTooShort = false,
  voiceCancelZone = 'none',
  voiceHoldReleaseToken = 0,
  voiceInterimTranscript,
  onBack,
  onProfilePress,
  onSendText,
  onPickImages,
  onToggleEmojiPanel,
  onEmojiSelect,
  onEmojiPanelClose,
  onDraftChange,
  onComposerFocusChange,
  onCharacterVoicePress,
  onUserVoicePress,
  onVoiceHoldStart,
  onVoiceHoldMove,
  onVoiceHoldEnd,
  onMessageLongPress,
  onImagePress,
  onFailedMessagePress,
  onShareCardPress,
  onLinkCardPress,
  rollbackMenuOpen = false,
  rollbackCanCopy = false,
  rollbackCanRollback = false,
  onRollbackMenuClose,
  onRollbackCopy,
  onRollbackRequest,
  rollbackConfirmOpen = false,
  rollbackConfirmLoading = false,
  onRollbackConfirmClose,
  onRollbackConfirm,
  versionSyncDialogOpen = false,
  versionSyncUpdating = false,
  onVersionSyncUpdate,
  onVersionSyncDismiss,
  onVersionSyncClose,
}: CharacterChatScreenProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [composerFocused, setComposerFocused] = useState(false)
  const [composerInputMode, setComposerInputMode] = useState<ChatComposerInputMode>('text')
  const { config, pageBackground, bubbleStyle, applyConfig } = useChatAtmosphere(character.id)

  const isVoiceActive =
    voiceRecorderPhase === 'requesting' ||
    voiceRecorderPhase === 'recording' ||
    voiceRecorderPhase === 'processing' ||
    voiceIsCancelled ||
    voicePressTooShort

  const dismissComposerOverlay = showEmojiPanel || composerFocused

  const handleDismissComposer = () => {
    if (showEmojiPanel) onEmojiPanelClose()
    if (composerFocused) {
      Keyboard.dismiss()
      setComposerFocused(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: pageBackground.baseColor }]}>
      {pageBackground.imageSource ? (
        <View style={styles.pageBackgroundImage} pointerEvents="none">
          <PopImage
            source={pageBackground.imageSource}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}

      <View style={styles.foreground}>
      <ChatHeader
        name={character.name}
        characterAka={characterAka}
        onBack={onBack}
        onProfilePress={onProfilePress}
        onMenuPress={() => setSettingsOpen(true)}
      />

      <View style={styles.messageArea}>
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>加载中…</Text>
          </View>
        ) : (
          <>
            {isLoadingOlderHistory && (
              <View style={styles.historyHintRow}>
                <Text style={styles.historyHintText}>加载更早的消息…</Text>
              </View>
            )}
            {!isLoadingOlderHistory && historyUpHasMore && (
              <View style={styles.historyHintRow}>
                <Text style={styles.historyHintTextMuted}>上滑查看更多</Text>
              </View>
            )}
            <ChatMessageList
              listRef={listRef}
              messages={messages}
              avatar={character.avatar}
              isTyping={isTyping}
              playingVoiceId={playingVoiceId}
              bubbleStyle={bubbleStyle}
              onAvatarPress={onProfilePress}
              onCharacterVoicePress={onCharacterVoicePress}
              onUserVoicePress={onUserVoicePress}
              onMessageLongPress={onMessageLongPress}
              onImagePress={onImagePress}
              onFailedMessagePress={onFailedMessagePress}
              onShareCardPress={onShareCardPress}
              onLinkCardPress={onLinkCardPress}
              onScroll={onScroll}
              onContentSizeChange={onContentSizeChange}
              onLayout={onLayout}
              onScrollToIndexFailed={onScrollToIndexFailed}
            />
            {dismissComposerOverlay && (
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleDismissComposer}
                accessibilityLabel="收起输入"
              />
            )}
            {showNewMessageHint && onJumpToLatest && (
              <ChatNewMessageHint count={newMessageCount} onPress={onJumpToLatest} />
            )}
          </>
        )}
      </View>

      <View style={styles.inputArea}>
        {isVoiceActive && (
          <View style={styles.voiceToastOverlay} pointerEvents="none">
            <VoiceRecordingBanner
              phase={voiceRecorderPhase}
              isCancelled={voiceIsCancelled}
              isPressTooShort={voicePressTooShort}
              permissionDenied={voicePermissionDenied}
              cancelZone={voiceCancelZone}
              interimTranscript={voiceInterimTranscript}
            />
          </View>
        )}
        <ChatInputBar
          onFocusChange={focused => {
            setComposerFocused(focused)
            onComposerFocusChange?.(focused)
          }}
          composerExpanded={composerFocused && !showEmojiPanel}
          inputMode={composerInputMode}
          onInputModeChange={setComposerInputMode}
          onSendText={onSendText}
          onPlusPress={() => {
            if (showEmojiPanel) onEmojiPanelClose()
            void onPickImages()
          }}
          onSendEmojiPress={onToggleEmojiPanel}
          onEmojiPanelClose={onEmojiPanelClose}
          showEmojiPanel={showEmojiPanel}
          draft={draft}
          onDraftChange={onDraftChange}
          voiceRecorderPhase={voiceRecorderPhase}
          voiceCancelZone={voiceCancelZone}
          voiceHoldReleaseToken={voiceHoldReleaseToken}
          onVoiceHoldStart={onVoiceHoldStart}
          onVoiceHoldMove={onVoiceHoldMove}
          onVoiceHoldEnd={onVoiceHoldEnd}
        />
      </View>

      <ChatEmojiBottomSheet
        open={showEmojiPanel}
        panel={emojiPanel}
        loading={emojiLoading}
        fetchFailed={emojiFetchFailed}
        onRetry={onEmojiRetry}
        onSelect={onEmojiSelect}
      />

      <ChatSettingsDrawer
        open={settingsOpen}
        characterId={character.id}
        atmosphereConfig={config}
        onApplyAtmosphere={applyConfig}
        onClose={() => setSettingsOpen(false)}
      />

      <ChatMessageContextMenu
        open={rollbackMenuOpen}
        canCopy={rollbackCanCopy}
        canRollback={rollbackCanRollback}
        onClose={() => onRollbackMenuClose?.()}
        onCopy={() => onRollbackCopy?.()}
        onRollback={() => onRollbackRequest?.()}
      />

      <ChatRollbackConfirmDialog
        open={rollbackConfirmOpen}
        loading={rollbackConfirmLoading}
        onClose={() => onRollbackConfirmClose?.()}
        onConfirm={() => onRollbackConfirm?.()}
      />

      <ChatCharacterVersionSyncDialog
        open={versionSyncDialogOpen}
        loading={versionSyncUpdating}
        onUpdate={() => onVersionSyncUpdate?.()}
        onDismiss={() => onVersionSyncDismiss?.()}
        onClose={() => onVersionSyncClose?.()}
      />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageBackgroundImage: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  foreground: {
    flex: 1,
    zIndex: 1,
  },
  messageArea: {
    flex: 1,
    overflow: 'hidden',
  },
  historyHintRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyHintText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.3)',
  },
  historyHintTextMuted: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.2)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
  inputArea: {
    position: 'relative',
  },
  /** FE: absolute inset-x-0 bottom-full — 浮在输入框上方，不占布局高度 */
  voiceToastOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 30,
  },
})
