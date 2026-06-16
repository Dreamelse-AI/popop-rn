import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'

import { getMyAnonymousTags, setMyAnonymousTags } from '@/generated/arca_api'
import { storage } from '@/shared/storage'

import IconBack from '@/shared/assets/character/add-character/icon-back.svg'

const MATCH_PREF_KEY = 'popop-match-preference'

type MatchPreference = {
  tags: string[]
  personality: string
  gender: string | null
  emoji: string
}

export function savePreference(pref: MatchPreference) {
  storage.set(MATCH_PREF_KEY, JSON.stringify(pref))
}

export function getMatchPreference(): MatchPreference {
  try {
    const raw = storage.get(MATCH_PREF_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { tags: [], personality: '', gender: null, emoji: '🫠' }
}

export function hasCompletedMatchSetup(): boolean {
  return storage.get(MATCH_PREF_KEY) !== null
}

export function clearMatchSetup() {
  storage.remove(MATCH_PREF_KEY)
}

export const MOODS = [
  { emoji: '😭', labelKey: 'randomMatch.sad' },
  { emoji: '🫠', labelKey: 'randomMatch.depressed' },
  { emoji: '😄', labelKey: 'randomMatch.happy' },
] as const

type RandomMatchPageProps = {
  onBack: () => void
  onStartMatching: () => void
}

export function RandomMatchPage({ onBack, onStartMatching }: RandomMatchPageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (hasCompletedMatchSetup()) {
      onStartMatching()
    }
  }, [onStartMatching])

  const [selectedMood, setSelectedMood] = useState(1)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [personalityDesc, setPersonalityDesc] = useState('')
  const [gender, setGender] = useState<string | null>(null)
  const [genderOpen, setGenderOpen] = useState(false)
  const [tagLimitTip, setTagLimitTip] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMyAnonymousTags()
      .then(resp => {
        if (!cancelled && resp.tags?.length) {
          setTags(resp.tags.slice(0, 3))
        }
      })
      .catch(() => { /* 加载失败时静默，用户可重新填写 */ })
    return () => { cancelled = true }
  }, [])

  const handleSkip = () => {
    savePreference({ tags: [], personality: '', gender: null, emoji: MOODS[selectedMood]?.emoji ?? '🫠' })
    onStartMatching()
  }

  const handleStartChat = () => {
    savePreference({ tags, personality: personalityDesc, gender, emoji: MOODS[selectedMood]?.emoji ?? '🫠' })
    void setMyAnonymousTags({ tags }).catch(() => { /* ignore */ })
    onStartMatching()
  }

  const handleAddTag = () => {
    if (tags.length >= 3) {
      setTagLimitTip(true)
      setTimeout(() => setTagLimitTip(false), 2000)
      return
    }
    const trimmed = tagInput.trim()
    if (!trimmed || trimmed.length > 8) return
    setTags([...tags, trimmed])
    setTagInput('')
  }

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="返回">
        <IconBack width={36} height={36} />
      </Pressable>

      {/* Mood section */}
      <View style={styles.moodSection}>
        <Text style={styles.moodTitle}>{t('randomMatch.currentMood')}</Text>
        <View style={styles.moodRow}>
          {MOODS.map((mood, index) => (
            <Pressable key={mood.labelKey} onPress={() => setSelectedMood(index)} style={styles.moodItem}>
              <Text style={[styles.moodEmoji, { fontSize: selectedMood === index ? 120 : 70, opacity: selectedMood === index ? 1 : 0.3 }]}>
                {mood.emoji}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.moodLabel}>
          {MOODS[selectedMood] ? t(MOODS[selectedMood].labelKey) : ''}
        </Text>
      </View>

      {/* Form */}
      <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
        {/* Identity tags */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎭 我的匿名身份标签</Text>
          {tags.map((tag, index) => (
            <View key={`${tag}-${index}`} style={styles.tagRow}>
              <Text style={styles.tagText}>{tag}</Text>
              <Pressable onPress={() => handleRemoveTag(index)} style={styles.tagRemove}>
                <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                  <Path d="M5 5l8 8M13 5l-8 8" stroke="black" strokeOpacity={0.3} strokeWidth={1.5} strokeLinecap="round" />
                </Svg>
              </Pressable>
            </View>
          ))}
          {tags.length < 3 && (
            <View style={styles.tagInputRow}>
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                placeholder="请输入身份关键词..."
                placeholderTextColor="rgba(0,0,0,0.2)"
                style={styles.tagInput}
                returnKeyType="done"
              />
              <Pressable onPress={handleAddTag} style={styles.addTagButton}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path d="M10 4v12M4 10h12" stroke="black" strokeOpacity={0.3} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </Pressable>
            </View>
          )}
          {tagLimitTip && <Text style={styles.tipText}>最多只能输入3个标签哦</Text>}
        </View>

        {/* Preference */}
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>希望找什么样的人</Text>
          <TextInput
            value={personalityDesc}
            onChangeText={v => setPersonalityDesc(v.slice(0, 20))}
            placeholder="请输入性格描述..."
            placeholderTextColor="rgba(0,0,0,0.2)"
            style={styles.personalityInput}
            multiline
            maxLength={20}
          />
          <Text style={styles.charCount}>{personalityDesc.length}/20</Text>
          <View style={styles.divider} />
          <Pressable onPress={() => setGenderOpen(true)} style={styles.genderRow}>
            <View>
              <Text style={styles.genderLabel}>性别</Text>
              <Text style={styles.genderValue}>{gender ?? '请选择'}</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={[styles.bottomButtons, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('randomMatch.skip')}</Text>
        </Pressable>
        <Pressable onPress={handleStartChat} style={styles.chatButton}>
          <Text style={styles.chatText}>{t('randomMatch.goToChat')}</Text>
        </Pressable>
      </View>

      {/* Gender picker */}
      <Modal visible={genderOpen} transparent animationType="slide" onRequestClose={() => setGenderOpen(false)}>
        <Pressable style={styles.genderOverlay} onPress={() => setGenderOpen(false)}>
          <View style={styles.genderPanel}>
            <Text style={styles.genderPanelTitle}>选择性别</Text>
            {['不限', '男性', '女性', '其他'].map(opt => (
              <Pressable
                key={opt}
                onPress={() => { setGender(opt); setGenderOpen(false) }}
                style={[styles.genderOption, gender === opt && styles.genderOptionActive]}
              >
                <Text style={[styles.genderOptionText, gender === opt && styles.genderOptionTextActive]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff0c4',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  moodSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 8,
  },
  moodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.9)',
    marginBottom: 8,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    gap: 20,
  },
  moodItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    lineHeight: 130,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  tagRemove: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    padding: 0,
  },
  addTagButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    marginTop: 8,
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
  },
  personalityInput: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    minHeight: 48,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.3)',
    textAlign: 'right',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 12,
  },
  genderRow: {
    paddingTop: 12,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  genderValue: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
    marginTop: 4,
  },
  bottomButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  skipButton: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  chatButton: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  genderOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  genderPanel: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  genderPanelTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    marginBottom: 12,
  },
  genderOption: {
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  genderOptionActive: {
    backgroundColor: '#000000',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.8)',
  },
  genderOptionTextActive: {
    color: '#ffffff',
  },
})
