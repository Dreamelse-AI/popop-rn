import { useState, useRef } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'

import type { EmojiItem, ListEmojiPanelResp } from '@/generated/arca_apiComponents'

import type { VoiceRecorderPhase, VoiceCancelZone } from '../hooks/use-voice-recorder'
import type { ChatCharacter, ChatMessage } from '../model/types'
import type { BubbleStyleTokens } from '../lib/chat-atmosphere-presets'
import { getBubbleStyleTokens } from '../lib/chat-atmosphere-presets'

import { ChatEmojiBottomSheet } from './chat-emoji-bottom-sheet'
import { ChatHeader } from './chat-header'
import { ChatInputBar, VoiceRecordingBanner } from './chat-input-bar'
import { ChatLocalAlbumSheet } from './chat-local-album-sheet'
import { ChatMessageContextMenu } from './chat-message-context-menu'
import { ChatMessageList } from './chat-message-list'
import { ChatCharacterVersionSyncDialog } from './chat-character-version-sync-dialog'
import { ChatRollbackConfirmDialog } from './chat-rollback-confirm-dialog'
import { ChatSettingsDrawer } from './chat-settings-drawer'

export type CharacterChatScreenProps = {
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
  draft: string
  playingVoiceId?: string | null
  voiceRecorderPhase?: VoiceRecorderPhase
  voicePermissionDenied?: boolean
  voiceIsCancelled?: boolean
  voicePressTooShort?: boolean
  voiceCancelZone?: VoiceCancelZone
  voiceInterimTranscript?: string
  onBack: () => void
  onProfilePress: () => void
  onSendText: (text: string) => void
  onSendImage: (imageUrl: string) => void
  onToggleEmojiPanel: () => void
  onEmojiSelect: (emoji: EmojiItem) => void
  onEmojiPanelClose: () => void
  onDraftChange: (value: string) => void
  onCharacterVoicePress?: (message: Extract<ChatMessage, { type: 'voice' }>) => void
  onUserVoicePress?: (message: Extract<ChatMessage, { type: 'voice' }>) => void
  onVoiceHoldStart?: (clientY: number) => void
  onVoiceHoldMove?: (clientY: number) => void
  onVoiceHoldEnd?: () => void
  onMessageLongPress?: (message: ChatMessage) => void
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
  draft,
  playingVoiceId,
  voiceRecorderPhase = 'idle',
  voicePermissionDenied = false,
  voiceIsCancelled = false,
  voicePressTooShort = false,
  voiceCancelZone = 'none',
  voiceInterimTranscript,
  onBack,
  onProfilePress,
  onSendText,
  onSendImage,
  onToggleEmojiPanel,
  onEmojiSelect,
  onEmojiPanelClose,
  onDraftChange,
  onCharacterVoicePress,
  onUserVoicePress,
  onVoiceHoldStart,
  onVoiceHoldMove,
  onVoiceHoldEnd,
  onMessageLongPress,
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
  const [albumSheetOpen, setAlbumSheetOpen] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const bubbleStyle = getBubbleStyleTokens('classic')

  return (
    <View style={styles.container}>
      <ChatHeader
        name={character.name}
        characterAka={characterAka}
        onBack={onBack}
        onProfilePress={onProfilePress}
        onMenuPress={() => setSettingsOpen(true)}
      />

      <View style={styles.messageArea}>
        <ScrollView
          ref={scrollRef}
          style={styles.messageScroll}
          contentContainerStyle={styles.messageScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoadingHistory ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>加载中…</Text>
            </View>
          ) : (
            <ChatMessageList
              messages={messages}
              avatar={character.avatar}
              isTyping={isTyping}
              playingVoiceId={playingVoiceId}
              bubbleStyle={bubbleStyle}
              onAvatarPress={onProfilePress}
              onCharacterVoicePress={onCharacterVoicePress}
              onUserVoicePress={onUserVoicePress}
              onMessageLongPress={onMessageLongPress}
            />
          )}
        </ScrollView>
      </View>

      <View style={styles.inputArea}>
        {voiceRecorderPhase !== 'idle' && (
          <View style={styles.voiceBannerWrapper}>
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
          onFocusChange={() => {}}
          composerExpanded={undefined}
          onSendText={onSendText}
          onPlusPress={() => {
            if (showEmojiPanel) onEmojiPanelClose()
            setAlbumSheetOpen(true)
          }}
          onSendEmojiPress={onToggleEmojiPanel}
          onEmojiPanelClose={onEmojiPanelClose}
          showEmojiPanel={showEmojiPanel}
          draft={draft}
          onDraftChange={onDraftChange}
          voiceRecorderPhase={voiceRecorderPhase}
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
        atmosphereConfig={{ bubbleStyleId: 'classic', backgroundId: 'yellow', customThemeId: '' }}
        onApplyAtmosphere={async () => {}}
        onClose={() => setSettingsOpen(false)}
      />

      <ChatLocalAlbumSheet
        open={albumSheetOpen}
        onClose={() => setAlbumSheetOpen(false)}
        onSelectPhoto={({ imageUrl }) => onSendImage(imageUrl)}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbf2d8',
  },
  messageArea: {
    flex: 1,
    overflow: 'hidden',
  },
  messageScroll: {
    flex: 1,
  },
  messageScrollContent: {
    paddingTop: 20,
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
  },
  voiceBannerWrapper: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
})
