import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  PanResponder,
  StyleSheet,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import IconPlus from '@/shared/assets/dialog/dialog-plus.svg'
import IconEmoji from '@/shared/assets/dialog/dialog-emoji.svg'
import IconBlackEmoji from '@/shared/assets/dialog/dialog-black-emoji.svg'
import IconVoice from '@/shared/assets/dialog/dialog-voice.svg'
import IconVoiceWave from '@/shared/assets/dialog/dialog-message-voice-wave.svg'
import IconKeyboard from '@/shared/assets/dialog/dialog-keyboard.svg'

import type { VoiceCancelZone, VoiceRecorderPhase } from '../hooks/use-voice-recorder'
import { useKeyboardInset } from './hooks/use-keyboard-inset'

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
  voiceCancelZone?: VoiceCancelZone
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
  voiceCancelZone = 'none',
  onVoiceHoldStart,
  onVoiceHoldMove,
  onVoiceHoldEnd,
}: ChatInputBarProps) {
  const insets = useSafeAreaInsets()
  const [keyboardExpanded, setKeyboardExpanded] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [voiceHolding, setVoiceHolding] = useState(false)
  const [text, setText] = useState('')
  const textInputRef = useRef<TextInput>(null)
  const pendingComposerOpenRef = useRef(false)
  const keyboardInset = useKeyboardInset(keyboardExpanded || inputFocused)

  const setComposerExpanded = useCallback(
    (next: boolean) => {
      setKeyboardExpanded(next)
      onFocusChange?.(next)
    },
    [onFocusChange],
  )

  useEffect(() => {
    if (draft !== undefined) setText(draft)
  }, [draft])

  useEffect(() => {
    if (showEmojiPanel && inputFocused && !pendingComposerOpenRef.current) {
      setInputFocused(false)
      textInputRef.current?.blur()
    }
  }, [showEmojiPanel, inputFocused])

  const activateComposer = useCallback(() => {
    setComposerExpanded(true)
    requestAnimationFrame(() => textInputRef.current?.focus())
  }, [setComposerExpanded])

  useEffect(() => {
    if (showEmojiPanel || !pendingComposerOpenRef.current) return
    pendingComposerOpenRef.current = false
    setComposerExpanded(true)
  }, [showEmojiPanel, setComposerExpanded])

  useEffect(() => {
    if (composerExpanded === false && keyboardExpanded) {
      setComposerExpanded(false)
      setInputFocused(false)
      textInputRef.current?.blur()
    }
  }, [composerExpanded, keyboardExpanded, setComposerExpanded])

  const updateText = useCallback(
    (value: string) => {
      setText(value)
      onDraftChange?.(value)
    },
    [onDraftChange],
  )

  const closeComposer = useCallback(() => {
    setComposerExpanded(false)
    setInputFocused(false)
    textInputRef.current?.blur()
  }, [setComposerExpanded])

  const openKeyboardComposer = useCallback(() => {
    if (showEmojiPanel) {
      pendingComposerOpenRef.current = true
      onEmojiPanelClose?.()
      return
    }
    setComposerExpanded(true)
  }, [showEmojiPanel, onEmojiPanelClose, setComposerExpanded])

  const handleSend = useCallback(() => {
    const value = text.trim()
    if (!value) return
    onSendText?.(value)
    updateText('')
    closeComposer()
  }, [text, onSendText, updateText, closeComposer])

  const handleEmojiPress = useCallback(() => {
    if (inputFocused) {
      setInputFocused(false)
      textInputRef.current?.blur()
    }
    onSendEmojiPress?.()
  }, [inputFocused, onSendEmojiPress])

  const isVoiceActive =
    voiceRecorderPhase === 'requesting' ||
    voiceRecorderPhase === 'recording' ||
    voiceRecorderPhase === 'processing'

  const voiceHoldHandlers = {
    onVoiceHoldStart,
    onVoiceHoldMove,
    onVoiceHoldEnd,
    disabled: isVoiceActive && voiceRecorderPhase === 'processing',
  }

  const preview = text.trim()
  const bottomPadding =
    keyboardInset > 0
      ? Math.max(8, keyboardInset)
      : showEmojiPanel
        ? 4
        : Platform.OS === 'android'
          ? 12
          : 24 + insets.bottom

  /** Figma 2566-36698 / 2670-22068 — 语音模式（含长按录音态） */
  if (!keyboardExpanded) {
    const voiceHoldLabel = getVoiceHoldLabel(voiceCancelZone, isVoiceActive)
    const isRecordingUi = isVoiceActive || voiceHolding
    const isCancelUi = isRecordingUi && voiceCancelZone === 'active'

    return (
      <View style={[styles.collapsedRow, { paddingBottom: bottomPadding }]}>
        <Pressable onPress={onPlusPress} style={styles.plusButton} accessibilityLabel="相册">
          <IconPlus width={20} height={20} />
        </Pressable>

        <View
          style={[
            styles.collapsedBubble,
            isRecordingUi && styles.collapsedBubbleRecording,
            isCancelUi && styles.collapsedBubbleCancel,
          ]}
        >
          <Pressable
            onPress={openKeyboardComposer}
            disabled={isRecordingUi}
            style={[styles.iconButton, isRecordingUi && styles.slotHidden]}
            accessibilityLabel="切换到键盘输入"
            accessibilityRole="button"
          >
            <IconVoice width={24} height={24} />
          </Pressable>

          {isRecordingUi ? (
            <VoiceHoldZone
              {...voiceHoldHandlers}
              active={isVoiceActive}
              cancelZone={voiceCancelZone}
              label={voiceHoldLabel}
              onHoldingChange={setVoiceHolding}
            />
          ) : showEmojiPanel || preview ? (
            <Pressable
              onPress={showEmojiPanel ? openKeyboardComposer : activateComposer}
              style={styles.previewZone}
              accessibilityLabel="输入消息"
            >
              <Text
                style={[styles.previewText, !preview && styles.previewPlaceholder]}
                numberOfLines={1}
              >
                {preview || '输入消息'}
              </Text>
            </Pressable>
          ) : (
            <VoiceHoldZone
              {...voiceHoldHandlers}
              active={isVoiceActive}
              cancelZone={voiceCancelZone}
              label={voiceHoldLabel}
              onHoldingChange={setVoiceHolding}
            />
          )}

          <Pressable
            onPress={handleEmojiPress}
            disabled={isRecordingUi}
            style={[styles.iconButton, isRecordingUi && styles.slotHidden]}
            accessibilityLabel="表情"
            accessibilityState={{ selected: showEmojiPanel }}
          >
            {showEmojiPanel ? (
              <IconBlackEmoji width={24} height={24} />
            ) : (
              <IconEmoji width={24} height={24} />
            )}
          </Pressable>
        </View>
      </View>
    )
  }

  /** Figma 2670-21933 — 键盘模式 */
  return (
    <View style={[styles.collapsedRow, { paddingBottom: bottomPadding }]}>
      <Pressable onPress={onPlusPress} style={styles.plusButton} accessibilityLabel="相册">
        <IconPlus width={20} height={20} />
      </Pressable>

      <View style={styles.collapsedBubble}>
        <Pressable
          onPress={closeComposer}
          style={styles.iconButton}
          accessibilityLabel="切换到语音输入"
          accessibilityRole="button"
        >
          <IconKeyboard width={24} height={24} />
        </Pressable>

        <TextInput
          ref={textInputRef}
          value={text}
          onChangeText={updateText}
          onSubmitEditing={handleSend}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          style={styles.keyboardInput}
          placeholder="自由输入.."
          placeholderTextColor="rgba(0,0,0,0.3)"
          returnKeyType="send"
          blurOnSubmit={false}
          accessibilityLabel="消息输入"
        />

        <Pressable
          onPress={handleEmojiPress}
          style={styles.iconButton}
          accessibilityLabel="表情"
          accessibilityState={{ selected: showEmojiPanel }}
        >
          {showEmojiPanel ? (
            <IconBlackEmoji width={24} height={24} />
          ) : (
            <IconEmoji width={24} height={24} />
          )}
        </Pressable>
      </View>
    </View>
  )
}

type VoiceHoldZoneProps = {
  disabled?: boolean
  active?: boolean
  cancelZone?: VoiceCancelZone
  label: string
  onHoldingChange?: (holding: boolean) => void
  onVoiceHoldStart?: (clientY: number) => void
  onVoiceHoldMove?: (clientY: number) => void
  onVoiceHoldEnd?: () => void
}

function getVoiceHoldLabel(cancelZone: VoiceCancelZone, isActive: boolean): string {
  if (!isActive) return '按住说话'
  if (cancelZone === 'active') return '松开手指，取消发送'
  if (cancelZone === 'approaching') return '继续上移取消发送'
  return '松手发送，上移取消'
}

function VoiceHoldZone({
  disabled = false,
  active = false,
  cancelZone = 'none',
  label,
  onHoldingChange,
  onVoiceHoldStart,
  onVoiceHoldMove,
  onVoiceHoldEnd,
}: VoiceHoldZoneProps) {
  const holdingRef = useRef(false)
  const [pressing, setPressing] = useState(false)
  const isRecordingUi = active || pressing
  const isCancelUi = isRecordingUi && cancelZone === 'active'

  const handlersRef = useRef({
    disabled,
    onHoldingChange,
    onVoiceHoldStart,
    onVoiceHoldMove,
    onVoiceHoldEnd,
  })
  handlersRef.current = {
    disabled,
    onHoldingChange,
    onVoiceHoldStart,
    onVoiceHoldMove,
    onVoiceHoldEnd,
  }

  const endHold = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setPressing(false)
    handlersRef.current.onHoldingChange?.(false)
    handlersRef.current.onVoiceHoldEnd?.()
  }, [])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !handlersRef.current.disabled,
        onStartShouldSetPanResponderCapture: () => !handlersRef.current.disabled,
        onMoveShouldSetPanResponder: () => holdingRef.current,
        onMoveShouldSetPanResponderCapture: () => holdingRef.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (handlersRef.current.disabled) return
          holdingRef.current = true
          setPressing(true)
          handlersRef.current.onHoldingChange?.(true)
          handlersRef.current.onVoiceHoldStart?.(event.nativeEvent.pageY)
        },
        onPanResponderMove: (event) => {
          if (!holdingRef.current || handlersRef.current.disabled) return
          handlersRef.current.onVoiceHoldMove?.(event.nativeEvent.pageY)
        },
        onPanResponderRelease: endHold,
        onPanResponderTerminate: endHold,
      }),
    [endHold],
  )

  return (
    <View
      {...panResponder.panHandlers}
      style={styles.voiceHoldZone}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {isRecordingUi ? (
        isCancelUi ? (
          <Text style={styles.voiceHoldLabelCancel}>{label}</Text>
        ) : (
          <IconVoiceWave width={44} height={26} />
        )
      ) : (
        <Text style={styles.voiceHoldLabel}>{label}</Text>
      )}
    </View>
  )
}

type VoiceRecordingBannerProps = {
  phase: VoiceRecorderPhase
  isCancelled: boolean
  isPressTooShort?: boolean
  permissionDenied: boolean
  cancelZone?: VoiceCancelZone
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
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedBubble: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
  },
  collapsedBubbleRecording: {
    backgroundColor: '#fdeab3',
    gap: 0,
    justifyContent: 'center',
  },
  collapsedBubbleCancel: {
    backgroundColor: '#e54545',
  },
  slotHidden: {
    width: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  voiceHoldZone: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceHoldLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: 'rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  voiceHoldLabelCancel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#ffffff',
    textAlign: 'center',
  },
  previewZone: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: 'rgba(0,0,0,0.9)',
    textAlign: 'left',
  },
  previewPlaceholder: {
    color: 'rgba(0,0,0,0.3)',
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardInput: {
    flex: 1,
    height: 22,
    padding: 0,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: 'rgba(0,0,0,0.9)',
    textAlign: 'center',
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
