import { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'
import Svg, { Path } from 'react-native-svg'

import IconClose from '@/shared/assets/random-match/icon-close.svg'
import IconShuffle from '@/shared/assets/random-match/icon-shuffle.svg'
import IconPhoto from '@/shared/assets/random-match/icon-photo.svg'
import IconSend from '@/shared/assets/random-match/icon-send.svg'
import IconSendActive from '@/shared/assets/random-match/icon-send-active.svg'
import IconMic from '@/shared/assets/random-match/icon-mic.svg'
import IconEdit from '@/shared/assets/random-match/icon-edit.svg'

import type { PhoneMessageOutput } from '@/generated/arca_apiComponents'
import { addFriendFromAnonymousChat } from '@/generated/arca_api'
import { showGlobalToast } from '@/shared/wallet'
import { useVoiceRecorder } from '@/features/chat/hooks/use-voice-recorder'
import { VoiceRecordingBanner } from '@/features/chat/ui/chat-input-bar'

import { MATCH_TEMPLATES, type MatchTemplate } from './match-templates'
import { getMatchPreference, savePreference, MOODS } from './random-match-page'

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
  const [genderFilter, setGenderFilter] = useState<string | null>(null)
  const [genderMenuOpen, setGenderMenuOpen] = useState(false)

  const [myTags, setMyTags] = useState<string[]>(() => getMatchPreference().tags)
  const [myEmoji, setMyEmoji] = useState<string>(() => getMatchPreference().emoji)
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [editMoodIndex, setEditMoodIndex] = useState(() => {
    const pref = getMatchPreference()
    const idx = MOODS.findIndex(m => m.emoji === pref.emoji)
    return idx >= 0 ? idx : 1
  })
  const [editTagInput, setEditTagInput] = useState('')

  const [showFriendInvite, setShowFriendInvite] = useState(false)

  const voiceRecorder = useVoiceRecorder()

  const myTagsDisplay = myTags.length > 0
    ? `${myEmoji} ${myTags.map(tag => `#${tag}`).join(' ')}`
    : `${myEmoji} #匿名`

  const currentGenderLabel = GENDER_OPTIONS.find(o => o.value === genderFilter)?.labelKey
    ? t(GENDER_OPTIONS.find(o => o.value === genderFilter)!.labelKey)
    : t('randomMatch.genderMale')

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
    if (!value || isSending || !chatSessionId) return
    setIsSending(true)
    setIsTyping(true)
    setInputText('')
    setCharacterMessage('')
    try {
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000))
      const MOCK_REPLIES = [
        '그렇구나~ 더 이야기해줘!',
        '오 진짜? 나도 그런 적 있어',
        '음... 그건 좀 어려운 상황이네',
        '헤헤 재밌다 😊',
        '그래서 어떻게 됐어?',
      ]
      const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]!
      setCharacterMessage(reply)
    } catch (err) {
      showGlobalToast(t('randomMatch.sendFailed', '发送失败，请重试'))
    } finally {
      setIsSending(false)
      setIsTyping(false)
    }
  }, [inputText, isSending, chatSessionId, t])

  const handleAddFriend = useCallback(async () => {
    if (!chatSessionId) return
    try {
      const resp = await addFriendFromAnonymousChat({ chat_session_id: chatSessionId })
      if (resp.accepted) {
        showGlobalToast(t('randomMatch.friendAccepted', '对方接受了好友邀请'))
        navigation.navigate('CharacterChat', { characterId: resp.character_id ?? '' })
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

  const handleVoiceEnd = useCallback(async () => {
    const result = await voiceRecorder.finishRecording()
    if (result?.transcript) {
      setInputText(prev => prev + result.transcript)
    }
  }, [voiceRecorder])

  const handleOpenEdit = useCallback(() => {
    setEditMoodIndex(MOODS.findIndex(m => m.emoji === myEmoji) >= 0 ? MOODS.findIndex(m => m.emoji === myEmoji) : 1)
    setEditTagInput('')
    setShowEditPanel(true)
  }, [myEmoji])

  const handleCloseEdit = useCallback(() => {
    const newEmoji = MOODS[editMoodIndex]?.emoji ?? '🫠'
    setMyEmoji(newEmoji)
    const pref = getMatchPreference()
    savePreference({ ...pref, tags: myTags, emoji: newEmoji })
    setShowEditPanel(false)
  }, [editMoodIndex, myTags])

  const handleEditAddTag = useCallback(() => {
    const trimmed = editTagInput.trim()
    if (!trimmed || trimmed.length > 8 || myTags.length >= 3) return
    setMyTags(prev => [...prev, trimmed])
    setEditTagInput('')
  }, [editTagInput, myTags])

  const handleEditRemoveTag = useCallback((index: number) => {
    setMyTags(prev => prev.filter((_, i) => i !== index))
  }, [])

  const style = MATCH_TEMPLATES[template]

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => setShowExitConfirm(true)} style={styles.headerButton}>
          <IconClose width={36} height={36} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('randomMatch.title')}</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setGenderMenuOpen(!genderMenuOpen)}
            style={styles.genderTrigger}
          >
            <Text style={styles.genderTriggerText}>{currentGenderLabel}</Text>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={genderMenuOpen ? { transform: [{ rotate: '-90deg' }] } : { transform: [{ rotate: '90deg' }] }}>
              <Path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Pressable onPress={onShuffle} style={styles.headerButton}>
            <IconShuffle width={36} height={36} />
          </Pressable>
        </View>
      </View>

      {/* Gender dropdown */}
      {genderMenuOpen && (
        <View style={styles.genderDropdown}>
          {GENDER_OPTIONS.map(opt => (
            <Pressable
              key={opt.labelKey}
              onPress={() => { setGenderFilter(opt.value); setGenderMenuOpen(false) }}
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
          <Text style={[styles.anonTags, { color: style.tagColor }]}>
            {anonymousTags.map(tag => `#${tag}`).join(' ') || '#匿名'}
          </Text>
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
          <Pressable onPress={handleOpenEdit} style={styles.myTagsRow}>
            <Text style={styles.myTagsText}>{myTagsDisplay}</Text>
            <IconEdit width={12} height={12} />
          </Pressable>
          <View style={styles.myInputArea}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('randomMatch.chatPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.2)"
              style={styles.myInput}
              multiline
              editable={!isSending}
            />
          </View>
          <View style={styles.myCardBottom}>
            <Pressable style={styles.photoButton}>
              <IconPhoto width={36} height={36} />
            </Pressable>
            <View style={styles.rightActions}>
              <Pressable
                onPressIn={() => voiceRecorder.startRecording(0)}
                onPressOut={() => void handleVoiceEnd()}
                style={[styles.micButton, voiceRecorder.phase !== 'idle' && styles.micButtonActive]}
              >
                <IconMic width={36} height={36} />
              </Pressable>
              <Pressable onPress={() => void handleSend()} disabled={isSending || !inputText.trim()} style={styles.sendButton}>
                {!isSending && inputText.trim() ? (
                  <IconSendActive width={36} height={36} />
                ) : (
                  <IconSend width={36} height={36} />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Voice recording banner */}
      {voiceRecorder.phase !== 'idle' && (
        <View style={styles.voiceBannerOverlay}>
          <VoiceRecordingBanner
            phase={voiceRecorder.phase}
            isCancelled={voiceRecorder.isCancelled}
            isPressTooShort={voiceRecorder.isPressTooShort}
            permissionDenied={voiceRecorder.permissionDenied}
            cancelZone={voiceRecorder.cancelZone}
            interimTranscript={voiceRecorder.interimTranscript}
          />
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
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>{t('randomMatch.friendInviteTitle')}</Text>
            <Text style={styles.friendInviteMessage}>{characterMessage}</Text>
            <View style={styles.confirmButtons}>
              <Pressable onPress={handleRejectFriendInvite} style={styles.confirmCancel}>
                <Text style={styles.confirmCancelText}>{t('randomMatch.reject')}</Text>
              </Pressable>
              <Pressable onPress={() => void handleAcceptFriendInvite()} style={styles.confirmOk}>
                <Text style={styles.confirmOkText}>{t('randomMatch.accept')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Edit panel */}
      {showEditPanel && (
        <Modal visible transparent animationType="slide" onRequestClose={handleCloseEdit}>
          <View style={styles.editOverlay}>
            <Pressable style={styles.editBackdrop} onPress={handleCloseEdit} />
            <View style={styles.editPanel}>
              <View style={styles.editHeader}>
                <Text style={styles.editTitle}>🎭 {t('randomMatch.editTitle')}</Text>
                <Pressable onPress={handleCloseEdit} style={styles.editCloseButton}>
                  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                    <Path d="M2 2l10 10M12 2L2 12" stroke="#333" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </Pressable>
              </View>

              {/* Emoji selector */}
              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>{t('randomMatch.currentMood')}</Text>
                <View style={styles.emojiCarousel}>
                  {MOODS.map((mood, index) => {
                    const isSelected = index === editMoodIndex
                    return (
                      <Pressable key={mood.labelKey} onPress={() => setEditMoodIndex(index)} style={styles.emojiItem}>
                        <Text style={{ fontSize: isSelected ? 80 : 50, opacity: isSelected ? 1 : 0.3 }}>{mood.emoji}</Text>
                      </Pressable>
                    )
                  })}
                </View>
                <Text style={styles.emojiLabel2}>
                  {MOODS[editMoodIndex] ? t(MOODS[editMoodIndex].labelKey) : ''}
                </Text>
              </View>

              {/* Tags */}
              <View style={styles.tagsSection}>
                {myTags.map((tag, i) => (
                  <View key={i} style={styles.tagRow}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <Pressable onPress={() => handleEditRemoveTag(i)} style={styles.tagRemoveButton}>
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path d="M7 7l10 10M17 7l-10 10" stroke="#999" strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                    </Pressable>
                  </View>
                ))}
                {myTags.length < 3 && (
                  <View style={styles.tagRow}>
                    <TextInput
                      value={editTagInput}
                      onChangeText={(v) => setEditTagInput(v.slice(0, 8))}
                      placeholder={t('randomMatch.addTagPlaceholder')}
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      style={styles.tagInput}
                      onSubmitEditing={handleEditAddTag}
                    />
                    <Pressable onPress={handleEditAddTag} style={styles.tagAddButton}>
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path d="M7 12h10M12 7v10" stroke="#999" strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>
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
  genderDropdown: {
    position: 'absolute',
    right: 60,
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
  },
  myTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myTagsText: {
    fontSize: 12,
    fontFamily: 'Black Han Sans',
    color: '#e8ce83',
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
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    zIndex: 50,
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
  friendInviteMessage: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
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
  editOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  editPanel: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Black Han Sans',
  },
  editCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  emojiSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.9)',
  },
  emojiCarousel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    gap: 20,
  },
  emojiItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiLabel2: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  tagsSection: {
    marginTop: 16,
    gap: 8,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  tagText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  tagRemoveButton: {
    width: 24,
    height: 24,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    padding: 0,
  },
  tagAddButton: {
    width: 24,
    height: 24,
  },
})
