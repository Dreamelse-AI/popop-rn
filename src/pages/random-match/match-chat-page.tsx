import { useEffect, useState, useCallback, type ComponentType } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'
import Svg, { Path } from 'react-native-svg'
import { cdnImage } from '@/shared/lib/cdn'

const IconClose = cdnImage('assets/random-match/icon-close.png')
const IconShuffle = cdnImage('assets/random-match/icon-shuffle.png')
const IconPhoto = cdnImage('assets/random-match/icon-photo.png')
const IconSend = cdnImage('assets/random-match/icon-send.png')
const IconSendActive = cdnImage('assets/random-match/icon-send-active.png')
const IconMic = cdnImage('assets/random-match/icon-mic.png')
const IconMicWhite = cdnImage('assets/random-match/icon-mic-white.png')

import type { PhoneMessageInput, PhoneMessageOutput } from '@/generated/arca_apiComponents'
import {
  addFriendFromAnonymousChat,
  sendMessageToAnonymousCharacter,
} from '@/generated/arca_api'
import { ApiError } from '@/shared/api/api-errors'
import { runPaidAction, showGlobalToast, useChargePointDisplay, refreshChargePoints } from '@/shared/wallet'
import { PopImage } from '@/shared/ui/pop-image'
import {
  getImageUploadErrorMessage,
  pickAndUploadImages,
} from '@/features/chat/lib/pick-and-upload-images'

import { MATCH_TEMPLATES, type MatchTemplate } from './match-templates'
import { getMatchPreference, saveMatchGender, type MatchGender } from './match-preference'
import { useMatchVoiceRecorder } from './use-match-voice-recorder'

function resolveTemplate(emotion?: string): MatchTemplate {
  if (emotion === 'heartbeat') return 'heartbeat'
  if (emotion === 'shy') return 'shy'
  if (emotion === 'emo') return 'emo'
  return 'default'
}

const GENDER_OPTIONS = [
  { emoji: '☺️', labelKey: 'randomMatch.genderNoLimit', value: null },
  { emoji: '👩', labelKey: 'randomMatch.genderFemale', value: 'female' },
  { emoji: '👨', labelKey: 'randomMatch.genderMale', value: 'male' },
  { emoji: '👾', labelKey: 'randomMatch.genderNonHuman', value: 'other' },
] as const

function TemplateOverlay({ style }: { style: (typeof MATCH_TEMPLATES)[MatchTemplate] }) {
  if (!style.overlayImage) return null
  if (style.overlayMode === 'cover') {
    const img = style.overlayImage
    return (
      <PopImage
        uri={typeof img === 'string' ? img : undefined}
        source={typeof img === 'string' ? undefined : (img as { uri: string })}
        style={styles.templateOverlayCover}
        contentFit="cover"
      />
    )
  }
  const OverlaySvg = style.overlayImage as ComponentType<{ width?: number; height?: number }>
  return (
    <View style={styles.templateOverlayDecor} pointerEvents="none">
      <OverlaySvg width={120} height={120} />
    </View>
  )
}

type MatchChatPageProps = {
  chatSessionId: string
  anonymousTags: string[]
  greetingMessages: PhoneMessageOutput[]
  onExit: () => void
  onShuffle: () => void
}

export function MatchChatPage({
  chatSessionId,
  anonymousTags,
  greetingMessages,
  onExit,
  onShuffle,
}: MatchChatPageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [characterMessage, setCharacterMessage] = useState('')
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [template, setTemplate] = useState<MatchTemplate>('default')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [genderFilter, setGenderFilter] = useState<MatchGender>(() => getMatchPreference().gender)
  const [genderMenuOpen, setGenderMenuOpen] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [sentImageUrl, setSentImageUrl] = useState('')
  const [showFriendInvite, setShowFriendInvite] = useState(false)

  const voiceRecorder = useMatchVoiceRecorder()
  const randomMatchCost = useChargePointDisplay('random_match')

  const currentGenderLabel = (() => {
    const option = GENDER_OPTIONS.find(o => o.value === genderFilter)
    return option ? t(option.labelKey) : t('randomMatch.genderNoLimit')
  })()

  useEffect(() => {
    void refreshChargePoints()
  }, [])

  useEffect(() => {
    const greeting = greetingMessages?.[0]
    if (greeting) {
      setCharacterMessage(greeting.text?.text ?? '')
      if (greeting.emotion) {
        setTemplate(resolveTemplate(greeting.emotion))
      }
    }
  }, [greetingMessages])

  const handleSend = useCallback(async () => {
    const value = inputText.trim()
    const imageUrl = sentImageUrl
    if ((!value && !imageUrl) || isSending || !chatSessionId) return
    setIsSending(true)
    setIsTyping(true)
    setInputText('')
    setSentImageUrl('')

    const messages: PhoneMessageInput[] = []
    if (imageUrl) {
      messages.push({
        msg_type: 'image',
        image: { image: { id: '', url: imageUrl, media_type: 'image' } },
      })
    }
    if (value) {
      messages.push({ msg_type: 'text', text: { text: value } })
    }

    try {
      const resp = await runPaidAction(
        () => sendMessageToAnonymousCharacter({ chat_session_id: chatSessionId, messages }),
        {
          source: 'anonymous_chat_send',
          onInsufficientBalance: () => {
            setInputText(value)
            setSentImageUrl(imageUrl)
          },
        },
      )
      if (resp === null) return
      const replies = resp.character_messages ?? []
      setCharacterMessage('')
      const lastTextReply = [...replies].reverse().find(m => m.text?.text)
      if (lastTextReply?.text?.text) {
        setCharacterMessage(lastTextReply.text.text)
      }
      const lastEmotion = [...replies].reverse().find(m => m.emotion)?.emotion
      if (lastEmotion) setTemplate(resolveTemplate(lastEmotion))
      if (resp.friend_request_pending) {
        setShowFriendInvite(true)
      }
    } catch (error) {
      setInputText(value)
      setSentImageUrl(imageUrl)
      if (error instanceof ApiError && error.message.trim()) {
        showGlobalToast(error.message.trim())
      } else {
        showGlobalToast(t('randomMatch.sendFailed', '发送失败，请重试'))
      }
    } finally {
      setIsSending(false)
      setIsTyping(false)
    }
  }, [inputText, sentImageUrl, isSending, chatSessionId, t])

  const handleSendImage = useCallback((imageUrl: string) => {
    if (!imageUrl) return
    setSentImageUrl(imageUrl)
  }, [])

  const handlePickImage = useCallback(async () => {
    if (imageUploading) return

    setImageUploading(true)
    try {
      const results = await pickAndUploadImages({ scene: 'randomMatchChat' })
      const uploaded = results[0]
      if (uploaded?.imageUrl) {
        handleSendImage(uploaded.imageUrl)
      }
    } catch (error) {
      showGlobalToast(getImageUploadErrorMessage(error, t))
    } finally {
      setImageUploading(false)
    }
  }, [handleSendImage, imageUploading, t])

  const handleAddFriend = useCallback(async () => {
    if (!chatSessionId) return
    try {
      const resp = await addFriendFromAnonymousChat({ chat_session_id: chatSessionId })
      if (resp.accepted) {
        showGlobalToast(t('randomMatch.friendAccepted', '对方接受了好友邀请'))
        if (resp.character_id) {
          navigation.replace('CharacterDetail', { characterId: resp.character_id })
        }
      } else {
        showGlobalToast(resp.message || t('randomMatch.friendRejected', '对方拒绝了你的好友邀请'))
        if (resp.message) setCharacterMessage(resp.message)
      }
    } catch (err) {
      showGlobalToast(t('randomMatch.addFriendFailed', '加好友失败'))
    }
  }, [chatSessionId, navigation, t])

  const handleAcceptFriendInvite = useCallback(async () => {
    setShowFriendInvite(false)
    await handleAddFriend()
  }, [handleAddFriend])

  const handleRejectFriendInvite = useCallback(() => {
    setShowFriendInvite(false)
  }, [])

  const handleVoiceStart = useCallback(() => {
    void voiceRecorder.startRecording()
  }, [voiceRecorder])

  const handleVoiceEnd = useCallback(async () => {
    const result = await voiceRecorder.finishRecording()
    if (!result) return
    const transcript = result.transcript.trim()
    if (!transcript) {
      if (result.error === 'permission') {
        showGlobalToast(t('randomMatch.voicePermissionDenied', '无法访问麦克风'))
      } else if (result.error === 'network') {
        showGlobalToast(t('randomMatch.networkError'))
      } else if (result.error === 'no-speech') {
        showGlobalToast(t('randomMatch.voiceNoSpeech', '未识别到语音，请重试'))
      }
      return
    }
    setInputText(prev => (prev ? `${prev}${transcript}` : transcript))
  }, [voiceRecorder, t])

  const handleSelectGender = useCallback((value: MatchGender) => {
    setGenderFilter(value)
    setGenderMenuOpen(false)
    saveMatchGender(value)
  }, [])

  const voiceActive = voiceRecorder.phase !== 'idle'
  const style = MATCH_TEMPLATES[template]

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => setShowExitConfirm(true)} style={styles.headerButton}>
          <Image source={{ uri: IconClose }} style={{width: 36, height: 36}} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('randomMatch.title')}</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setGenderMenuOpen(!genderMenuOpen)}
            style={styles.genderTrigger}
          >
            <Text style={styles.genderTriggerText}>{currentGenderLabel}</Text>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={genderMenuOpen ? { transform: [{ rotate: '-90deg' }] } : { transform: [{ rotate: '90deg' }] }}>
              <Path d="M6 4l4 4-4 4" stroke="rgba(0,0,0,0.9)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Pressable onPress={onShuffle} style={styles.shuffleButton}>
            <View style={styles.shufflePrice}>
              <Text style={styles.shufflePriceEmoji}>🧊</Text>
              <Text style={styles.shufflePriceText}>{randomMatchCost.label}</Text>
            </View>
            <Image source={{ uri: IconShuffle }} style={{width: 20, height: 20}} />
          </Pressable>
        </View>
      </View>

      {/* Gender dropdown */}
      {genderMenuOpen && (
        <View style={styles.genderDropdown}>
          {GENDER_OPTIONS.map(opt => (
            <Pressable
              key={opt.labelKey}
              onPress={() => handleSelectGender(opt.value)}
              style={styles.genderOption}
            >
              <Text style={styles.genderEmoji}>{opt.emoji}</Text>
              <Text style={[styles.genderOptionText, genderFilter === opt.value && styles.genderOptionTextSelected]}>
                {t(opt.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {/* Character card */}
        <View style={[styles.characterCard, { backgroundColor: style.bgColor }]}>
          <TemplateOverlay style={style} />
          {anonymousTags.length > 0 && (
            <Text style={[styles.anonTags, { color: style.tagColor }]}>
              {anonymousTags.map(tag => `#${tag}`).join(' ')}
            </Text>
          )}
          <View style={styles.messageArea}>
            {isTyping ? (
              <Text style={styles.typingText}>{t('randomMatch.typing')}</Text>
            ) : (
              <Text style={[styles.characterMessageText, { color: style.textColor }]}>
                {characterMessage}
              </Text>
            )}
          </View>
          <View style={styles.characterCardBottom}>
            {style.emojiLabel ? (
              <Text style={[styles.emojiLabel, { color: style.emojiColor }]}>{style.emojiLabel}</Text>
            ) : <View />}
            <Pressable style={styles.addFriendButton} onPress={() => void handleAddFriend()}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M12 6a1.5 1.5 0 011.5 1.5v3h3a1.5 1.5 0 010 3h-3v3a1.5 1.5 0 01-3 0v-3h-3a1.5 1.5 0 010-3h3v-3A1.5 1.5 0 0112 6z" fill="white" />
              </Svg>
              <Text style={styles.addFriendText}>{t('randomMatch.addFriend')}</Text>
            </Pressable>
          </View>
        </View>

        {/* My card */}
        <View style={styles.myCard}>
          {sentImageUrl ? (
            <PopImage uri={sentImageUrl} style={styles.sentImageOverlay} contentFit="cover" />
          ) : null}
          <View style={styles.myInputArea}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={sentImageUrl ? '' : t('randomMatch.chatPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.2)"
              style={styles.myInput}
              multiline
              editable={!isSending}
            />
          </View>
          <View style={styles.myCardBottom}>
            <Pressable
              style={styles.photoButton}
              onPress={() => void handlePickImage()}
              disabled={imageUploading}
            >
              <Image source={{ uri: IconPhoto }} style={{width: 36, height: 36}} />
            </Pressable>
            <View style={styles.rightActions}>
              <Pressable
                onPressIn={handleVoiceStart}
                onPressOut={() => void handleVoiceEnd()}
                style={[styles.micButton, voiceActive && styles.micButtonActive]}
              >
                {voiceActive ? (
                  <Image source={{ uri: IconMicWhite }} style={{width: 36, height: 36}} />
                ) : (
                  <Image source={{ uri: IconMic }} style={{width: 36, height: 36}} />
                )}
              </Pressable>
              <Pressable
                onPress={() => void handleSend()}
                disabled={isSending || (!inputText.trim() && !sentImageUrl)}
                style={styles.sendButton}
              >
                {!isSending && (inputText.trim() || sentImageUrl) ? (
                  <Image source={{ uri: IconSendActive }} style={{width: 36, height: 36}} />
                ) : (
                  <Image source={{ uri: IconSend }} style={{width: 36, height: 36}} />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Voice recording banner */}
      {voiceActive && (
        <View style={styles.voiceBannerOverlay}>
          <View style={styles.voiceBanner}>
            <Text style={styles.voiceBannerText}>
              {voiceRecorder.phase === 'requesting'
                ? t('randomMatch.voiceRequesting', '正在请求麦克风权限…')
                : voiceRecorder.phase === 'processing'
                  ? (voiceRecorder.interimTranscript || t('randomMatch.voiceProcessing', '正在识别语音…'))
                  : (voiceRecorder.interimTranscript || t('randomMatch.voiceListening', '正在聆听…'))}
            </Text>
          </View>
        </View>
      )}

      {/* Exit confirm */}
      {showExitConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>{t('randomMatch.exitConfirmTitle')}</Text>
            <View style={styles.confirmButtons}>
              <Pressable onPress={() => setShowExitConfirm(false)} style={styles.confirmCancel}>
                <Text style={styles.confirmCancelText}>{t('randomMatch.exitCancel')}</Text>
              </Pressable>
              <Pressable onPress={onExit} style={styles.confirmOk}>
                <Text style={styles.confirmOkText}>{t('randomMatch.exitConfirm')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Friend invite dialog */}
      {showFriendInvite && (
        <View style={styles.confirmOverlay}>
          <View style={styles.friendInviteDialog}>
            <Text style={styles.friendInviteEmoji}>😊</Text>
            <Text style={styles.friendInviteTitle}>{t('randomMatch.friendInviteTitle')}</Text>
            <View style={styles.friendInviteButtons}>
              <Pressable onPress={handleRejectFriendInvite} style={styles.friendInviteCancel}>
                <Text style={styles.friendInviteCancelText}>{t('randomMatch.reject')}</Text>
              </Pressable>
              <Pressable onPress={() => void handleAcceptFriendInvite()} style={styles.friendInviteAccept}>
                <Text style={styles.friendInviteAcceptText}>{t('randomMatch.accept')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Black Han Sans',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genderTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingLeft: 12,
    paddingRight: 8,
  },
  genderTriggerText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.9)',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
  },
  shufflePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  shufflePriceEmoji: {
    fontSize: 16,
  },
  shufflePriceText: {
    minWidth: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  genderDropdown: {
    position: 'absolute',
    right: 12,
    top: 100,
    zIndex: 50,
    width: 160,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  genderEmoji: {
    fontSize: 16,
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  genderOptionTextSelected: {
    color: '#000000',
  },
  cardsContainer: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  characterCard: {
    flex: 1,
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  templateOverlayCover: {
    ...StyleSheet.absoluteFill,
    borderRadius: 30,
  },
  templateOverlayDecor: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
  anonTags: {
    fontSize: 12,
    fontFamily: 'Black Han Sans',
    opacity: 0.3,
  },
  messageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  typingText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  characterMessageText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  characterCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emojiLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 9999,
    backgroundColor: '#000000',
    paddingLeft: 6,
    paddingRight: 12,
  },
  addFriendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  myCard: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: '#fbf2d8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  sentImageOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 30,
  },
  myInputArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myInput: {
    width: '100%',
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.9)',
    textAlign: 'center',
    padding: 0,
  },
  myCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoButton: {
    width: 36,
    height: 36,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8ce83',
  },
  sendButton: {
    width: 36,
    height: 36,
  },
  voiceBannerOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  voiceBanner: {
    maxWidth: '80%',
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  voiceBannerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  confirmDialog: {
    marginHorizontal: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  friendInviteDialog: {
    width: 310,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    alignItems: 'center',
  },
  friendInviteEmoji: {
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 12,
  },
  friendInviteTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  friendInviteButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    width: '100%',
  },
  friendInviteCancel: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendInviteCancelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  friendInviteAccept: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendInviteAcceptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  confirmCancel: {
    flex: 1,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  confirmOk: {
    flex: 1,
    borderRadius: 9999,
    backgroundColor: '#000000',
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmOkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
})
