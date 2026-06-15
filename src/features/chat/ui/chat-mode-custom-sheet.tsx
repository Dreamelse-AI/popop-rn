import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/shared/ui/bottom-sheet'

export type ChatModeCustomSettings = {
  temperatureLevel: number
  customInstructions: string
}

export const DEFAULT_CHAT_MODE_CUSTOM_SETTINGS: ChatModeCustomSettings = {
  temperatureLevel: 1,
  customInstructions: '',
}

const CUSTOM_INSTRUCTIONS_MAX_LENGTH = 200
const TEMPERATURE_LABELS = ['理性', '平衡', '创意'] as const

type ChatModeCustomSheetProps = {
  open: boolean
  initialSettings?: ChatModeCustomSettings
  onClose: () => void
  onConfirm: (settings: ChatModeCustomSettings) => void
}

export function ChatModeCustomSheet({
  open,
  initialSettings = DEFAULT_CHAT_MODE_CUSTOM_SETTINGS,
  onClose,
  onConfirm,
}: ChatModeCustomSheetProps) {
  const { t } = useTranslation()
  const [draftSettings, setDraftSettings] = useState<ChatModeCustomSettings>(initialSettings)

  useEffect(() => {
    if (!open) return
    setDraftSettings(initialSettings)
  }, [open, initialSettings])

  return (
    <BottomSheet open={open} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('chatModeCustomSheet.title')}</Text>
          <View style={styles.headerDivider} />
        </View>

        <View style={styles.content}>
          {/* Temperature slider */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {TEMPERATURE_LABELS[draftSettings.temperatureLevel] ?? '平衡'}
            </Text>
            <View style={styles.sliderRow}>
              {TEMPERATURE_LABELS.map((label, index) => (
                <Pressable
                  key={label}
                  onPress={() => setDraftSettings(prev => ({ ...prev, temperatureLevel: index }))}
                  style={[styles.sliderOption, draftSettings.temperatureLevel === index && styles.sliderOptionActive]}
                >
                  <Text style={styles.sliderOptionText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Custom instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('chatModeCustomSheet.instructionsLabel')}</Text>
            <TextInput
              value={draftSettings.customInstructions}
              onChangeText={text =>
                setDraftSettings(prev => ({
                  ...prev,
                  customInstructions: text.slice(0, CUSTOM_INSTRUCTIONS_MAX_LENGTH),
                }))
              }
              placeholder={t('chatModeCustomSheet.instructionsPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.2)"
              style={styles.textarea}
              multiline
              maxLength={CUSTOM_INSTRUCTIONS_MAX_LENGTH}
            />
            <Text style={styles.charCount}>
              {draftSettings.customInstructions.length}/{CUSTOM_INSTRUCTIONS_MAX_LENGTH}
            </Text>
          </View>
        </View>

        <Pressable onPress={() => onConfirm(draftSettings)} style={styles.confirmButton}>
          <Text style={styles.confirmText}>{t('chatModeCustomSheet.confirm')}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 21,
    fontFamily: 'Black Han Sans',
    color: '#000000',
  },
  headerDivider: {
    marginTop: 12,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    gap: 24,
    paddingVertical: 12,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderOption: {
    width: 84,
    alignItems: 'center',
    paddingVertical: 8,
  },
  sliderOptionActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  sliderOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  textarea: {
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    textAlignVertical: 'top',
  },
  charCount: {
    paddingHorizontal: 8,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  confirmButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
