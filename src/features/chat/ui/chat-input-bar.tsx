import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'

import IconPlus from '@/shared/assets/dialog/dialog-plus.svg'
import IconEmoji from '@/shared/assets/dialog/dialog-black-emoji.svg'
import IconSend from '@/shared/assets/dialog/dialog-black-send.svg'
import IconVoice from '@/shared/assets/dialog/dialog-voice.svg'

import type { VoiceRecorderPhase } from '../hooks/use-voice-recorder'

type ChatInputBarProps = {
  onFocusChange?: (focused: boolean) => void
  onSendText?: (text: string) => void
  onPlusPress?: () => void
  onSendEmojiPress?: () => void
  onEmojiPanelClose?: () => void
  composerExpanded?: boolean
  showEmojiPanel?: boolean
  draft?: string
  onDraftChange?: (value: string) => void
  voiceRecorderPhase?: VoiceRecorderPhase
  onVoiceHoldStart?: (clientY: number) => void
  onVoiceHoldMove?: (clientY: number) => void
  onVoiceHoldEnd?: () => void
}

export function ChatInputBar({
  onFocusChange,
  onSendText,
  onPlusPress,
  onSendEmojiPress,
  onEmojiPanelClose,
  composerExpanded,
  showEmojiPanel = false,
  draft,
  onDraftChange,
  voiceRecorderPhase = 'idle',
  onVoiceHoldStart,
  onVoiceHoldMove,
  onVoiceHoldEnd,
}: ChatInputBarProps) {
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState('')
  const textInputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (draft !== undefined) setText(draft)
  }, [draft])

  useEffect(() => {
    if (composerExpanded === false && focused) {
      setFocused(false)
      onFocusChange?.(false)
      textInputRef.current?.blur()
    }
  }, [composerExpanded, focused, onFocusChange])

  const updateText = useCallback(
    (value: string) => {
      setText(value)
      onDraftChange?.(value)
    },
    [onDraftChange],
  )

  const handleSend = useCallback(() => {
    const value = text.trim()
    if (!value) return
    onSendText?.(value)
    updateText('')
    setFocused(false)
    onFocusChange?.(false)
    textInputRef.current?.blur()
  }, [text, onSendText, updateText, onFocusChange])

  const handleFocus = useCallback(() => {
    if (showEmojiPanel) {
      onEmojiPanelClose?.()
    }
    setFocused(true)
    onFocusChange?.(true)
  }, [showEmojiPanel, onEmojiPanelClose, onFocusChange])

  if (!focused) {
    const preview = text.trim()

    return (
      <View style={[styles.collapsedContainer, showEmojiPanel ? styles.collapsedWithEmoji : styles.collapsedNormal]}>
        <Pressable onPress={onPlusPress} style={styles.plusButton} accessibilityLabel="相册">
          <IconPlus width={20} height={20} />
        </Pressable>

        <View style={styles.collapsedInputRow}>
          <Pressable onPress={onVoiceHoldStart ? () => onVoiceHoldStart(0) : undefined} style={styles.voiceButton}>
            <IconVoice width={24} height={24} />
          </Pressable>

          <Pressable onPress={handleFocus} style={styles.collapsedTextArea}>
            {preview ? (
              <Text style={styles.previewText} numberOfLines={1}>{preview}</Text>
            ) : (
              <Text style={styles.placeholderText}>输入消息</Text>
            )}
          </Pressable>

          <Pressable onPress={onSendEmojiPress} style={styles.emojiButton} accessibilityLabel="表情">
            <IconEmoji width={24} height={24} />
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.expandedContainer}>
      <View style={styles.expandedInputWrapper}>
        <TextInput
          ref={textInputRef}
          value={text}
          onChangeText={updateText}
          onSubmitEditing={handleSend}
          autoFocus
          multiline
          style={styles.expandedInput}
          placeholder=""
          returnKeyType="send"
        />

        <View style={styles.expandedActions}>
          <Pressable onPress={onVoiceHoldStart ? () => onVoiceHoldStart(0) : undefined} style={styles.voiceButton}>
            <IconVoice width={24} height={24} />
          </Pressable>

          <View style={styles.rightActions}>
            <Pressable onPress={onSendEmojiPress} style={styles.emojiButton} accessibilityLabel="表情">
              <IconEmoji width={24} height={24} />
            </Pressable>
            <Pressable onPress={handleSend} disabled={!text.trim()} style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]} accessibilityLabel="发送">
              <IconSend width={24} height={24} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  )
}

type VoiceRecordingBannerProps = {
  phase: VoiceRecorderPhase
  isCancelled: boolean
  isPressTooShort?: boolean
  permissionDenied: boolean
  cancelZone?: string
  interimTranscript?: string
}

export function VoiceRecordingBanner({
  phase,
  isCancelled,
  isPressTooShort = false,
  permissionDenied,
  cancelZone = 'none',
  interimTranscript = '',
}: VoiceRecordingBannerProps) {
  let text = '松手发送，上移取消'

  if (isPressTooShort) {
    text = '按键时间太短'
  } else if (permissionDenied) {
    text = '无法访问麦克风'
  } else if (phase === 'requesting') {
    text = '正在请求麦克风权限…'
  } else if (phase === 'processing') {
    text = interimTranscript ? `识别中：${interimTranscript}` : '正在识别语音…'
  } else if (phase === 'recording' && interimTranscript) {
    text = interimTranscript
  } else if (isCancelled) {
    text = '已取消'
  } else if (cancelZone === 'active') {
    text = '松开手指，取消发送'
  } else if (cancelZone === 'approaching') {
    text = '继续上移取消发送'
  }

  return (
    <View style={[styles.banner, cancelZone === 'active' && styles.bannerDanger]}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  collapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  collapsedNormal: {
    paddingBottom: 24,
  },
  collapsedWithEmoji: {
    paddingBottom: 4,
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedInputRow: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
  },
  voiceButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedTextArea: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: 'rgba(0,0,0,0.9)',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  emojiButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  expandedInputWrapper: {
    minHeight: 116,
    borderRadius: 24,
    backgroundColor: '#ffffff',
  },
  expandedInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: 'rgba(0,0,0,0.9)',
    textAlignVertical: 'top',
  },
  expandedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  sendButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
  banner: {
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerDanger: {
    backgroundColor: '#e54545',
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
})
