import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View,
  Text,
  TextInput,
  Pressable,
  PanResponder,
  StyleSheet,
  Platform } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cdnImage } from '@/shared/lib/cdn'

const IconPlus = cdnImage('assets/dialog/dialog-plus.png')
const IconEmoji = cdnImage('assets/dialog/dialog-emoji.png')
const IconBlackEmoji = cdnImage('assets/dialog/dialog-black-emoji.png')
const IconVoice = cdnImage('assets/dialog/dialog-voice.png')
const IconVoiceWave = cdnImage('assets/dialog/dialog-message-voice-wave.png')
const IconKeyboard = cdnImage('assets/dialog/dialog-keyboard.png')

import type { VoiceCancelZone, VoiceRecorderPhase } from '../hooks/use-voice-recorder'
import { clampChatText, CHAT_TEXT_MAX_LENGTH } from '../config/chat-config'
import { useKeyboardInset } from './hooks/use-keyboard-inset'

export type ChatComposerInputMode = 'text' | 'voice'

type ChatInputBarProps = {
  onFocusChange?: (focused: boolean) => void
  onSendText?: (text: string) => void
  onPlusPress?: () => void
  onSendEmojiPress?: () => void
  onEmojiPanelClose?: () => void
  composerExpanded?: boolean
  inputMode?: ChatComposerInputMode
  onInputModeChange?: (mode: ChatComposerInputMode) => void
  showEmojiPanel?: boolean
  draft?: string
  onDraftChange?: (value: string) => void
  voiceRecorderPhase?: VoiceRecorderPhase
  voiceCancelZone?: VoiceCancelZone
  voiceHoldReleaseToken?: number
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
  inputMode = 'text',
  onInputModeChange,
  showEmojiPanel = false,
  draft,
  onDraftChange,
  voiceRecorderPhase = 'idle',
  voiceCancelZone = 'none',
  voiceHoldReleaseToken = 0,
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
  const isVoiceMode = inputMode === 'voice'

  useEffect(() => {
    if (draft !== undefined) setText(clampChatText(draft))
  }, [draft])

  useEffect(() => {
    if (isVoiceMode) {
      setKeyboardExpanded(false)
    }
  }, [isVoiceMode])

  useEffect(() => {
    if (showEmojiPanel && inputFocused && !pendingComposerOpenRef.current) {
      setInputFocused(false)
      textInputRef.current?.blur()
    }
  }, [showEmojiPanel, inputFocused])

  const collapseKeyboard = useCallback(() => {
    setKeyboardExpanded(false)
    setInputFocused(false)
    textInputRef.current?.blur()
    onFocusChange?.(false)
  }, [onFocusChange])

  const focusTextInput = useCallback(() => {
    requestAnimationFrame(() => textInputRef.current?.focus())
  }, [])

  const activateTextComposer = useCallback(
    (options?: { autoFocus?: boolean }) => {
      onInputModeChange?.('text')
      if (options?.autoFocus) {
        setKeyboardExpanded(true)
        onFocusChange?.(true)
        focusTextInput()
      }
    },
    [focusTextInput, onFocusChange, onInputModeChange],
  )

  const switchToVoiceMode = useCallback(() => {
    onInputModeChange?.('voice')
    collapseKeyboard()
  }, [collapseKeyboard, onInputModeChange])

  const switchToTextMode = useCallback(() => {
    activateTextComposer()
  }, [activateTextComposer])

  const handleModeToggle = useCallback(() => {
    if (isVoiceMode) {
      switchToTextMode()
      return
    }
    switchToVoiceMode()
  }, [isVoiceMode, switchToTextMode, switchToVoiceMode])

  const requestTextInputFocus = useCallback(() => {
    activateTextComposer()
    if (showEmojiPanel) {
      pendingComposerOpenRef.current = true
      onEmojiPanelClose?.()
      return
    }
    activateTextComposer({ autoFocus: true })
  }, [activateTextComposer, onEmojiPanelClose, showEmojiPanel])

  useEffect(() => {
    if (showEmojiPanel || !pendingComposerOpenRef.current) return
    pendingComposerOpenRef.current = false
    activateTextComposer({ autoFocus: true })
  }, [showEmojiPanel, activateTextComposer])

  useEffect(() => {
    if (composerExpanded === undefined) return
    if (composerExpanded) {
      if (inputMode === 'text') activateTextComposer({ autoFocus: true })
      return
    }
    if (showEmojiPanel) return
    if (keyboardExpanded) collapseKeyboard()
  }, [activateTextComposer, collapseKeyboard, composerExpanded, inputMode, keyboardExpanded, showEmojiPanel])

  const updateText = useCallback(
    (value: string) => {
      const next = clampChatText(value)
      setText(next)
      onDraftChange?.(next)
    },
    [onDraftChange],
  )

  const handleSend = useCallback(() => {
    const value = text.trim()
    if (!value) return
    onSendText?.(value)
    updateText('')
    onInputModeChange?.('text')
    collapseKeyboard()
  }, [text, onSendText, updateText, onInputModeChange, collapseKeyboard])

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

  const bottomPadding =
    keyboardInset > 0
      ? Math.max(8, keyboardInset)
      : showEmojiPanel
        ? 4
        : Platform.OS === 'android'
          ? 12
          : 24 + insets.bottom

  const voiceHoldLabel = getVoiceHoldLabel(voiceCancelZone, isVoiceActive)
  const isRecordingUi = isVoiceActive || voiceHolding
  const isCancelUi = isRecordingUi && voiceCancelZone === 'active'
  const hideSideIcons = isVoiceMode && isRecordingUi

  return (
    <View style={[styles.collapsedRow, { paddingBottom: bottomPadding }]}>
      <Pressable onPress={onPlusPress} style={styles.plusButton} accessibilityLabel="相册">
        <Image source={{ uri: IconPlus }} style={{ width: 20, height: 20 }} />
      </Pressable>

      <View
        style={[
          styles.collapsedBubble,
          isRecordingUi && styles.collapsedBubbleRecording,
          isCancelUi && styles.collapsedBubbleCancel,
        ]}
      >
        <Pressable
          onPress={handleModeToggle}
          disabled={hideSideIcons}
          style={[styles.iconButton, hideSideIcons && styles.slotHidden]}
          accessibilityLabel={isVoiceMode ? '切换到键盘输入' : '切换到语音输入'}
          accessibilityRole="button"
        >
          <Image
            source={{ uri: isVoiceMode ? IconKeyboard : IconVoice }}
            style={{ width: 24, height: 24 }}
          />
        </Pressable>

        {isVoiceMode ? (
          <VoiceHoldZone
            {...voiceHoldHandlers}
            active={isVoiceActive}
            cancelZone={voiceCancelZone}
            label={voiceHoldLabel}
            forceReleaseToken={voiceHoldReleaseToken}
            onHoldingChange={setVoiceHolding}
          />
        ) : (
          <Pressable
            onPress={showEmojiPanel ? requestTextInputFocus : undefined}
            style={styles.textInputZone}
            accessibilityLabel="输入消息"
          >
            <TextInput
              ref={textInputRef}
              value={text}
              onChangeText={updateText}
              maxLength={CHAT_TEXT_MAX_LENGTH}
              multiline={false}
              numberOfLines={1}
              scrollEnabled={false}
              onSubmitEditing={handleSend}
              onFocus={() => {
                setInputFocused(true)
                setKeyboardExpanded(true)
                onFocusChange?.(true)
              }}
              onBlur={() => setInputFocused(false)}
              editable={!showEmojiPanel}
              pointerEvents={showEmojiPanel ? 'none' : 'auto'}
              style={[
                styles.keyboardInput,
                !inputFocused && !text && styles.keyboardInputEmpty,
              ]}
              placeholder="自由输入…"
              placeholderTextColor="rgba(0,0,0,0.3)"
              returnKeyType="send"
              blurOnSubmit={false}
              accessibilityLabel="消息输入"
            />
          </Pressable>
        )}

        <Pressable
          onPress={handleEmojiPress}
          disabled={hideSideIcons}
          style={[styles.iconButton, hideSideIcons && styles.slotHidden]}
          accessibilityLabel="表情"
          accessibilityState={{ selected: showEmojiPanel }}
        >
          {showEmojiPanel ? (
            <Image source={{ uri: IconBlackEmoji }} style={{ width: 24, height: 24 }} />
          ) : (
            <Image source={{ uri: IconEmoji }} style={{ width: 24, height: 24 }} />
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
  forceReleaseToken?: number
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
  forceReleaseToken = 0,
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

  const releaseHoldWithoutSend = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setPressing(false)
    handlersRef.current.onHoldingChange?.(false)
  }, [])

  useEffect(() => {
    if (!forceReleaseToken) return
    releaseHoldWithoutSend()
  }, [forceReleaseToken, releaseHoldWithoutSend])

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
          <Image source={{ uri: IconVoiceWave }} style={{width: 44, height: 26}} />
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
  textInputZone: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardInput: {
    height: 22,
    alignSelf: 'stretch',
    padding: 0,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: 'rgba(0,0,0,0.9)',
    textAlign: 'left',
  },
  keyboardInputEmpty: {
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
