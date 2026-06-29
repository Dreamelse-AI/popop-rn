import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  PanResponder,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { Image } from 'expo-image'

import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { dialogAssets } from '@/shared/assets/dialog'
import type { ChatModelDisplay } from '@/features/chat/lib/chat-model-display'
import {
  clampTemperature,
  CUSTOM_INSTRUCTIONS_MAX_LENGTH,
  DEFAULT_TEMPERATURE,
  getNearestTemperatureAnchorIndex,
  percentToTemperature,
  temperatureToPercent,
} from '@/features/chat/lib/chat-model-display'

export type ChatModeCustomSettings = {
  temperatureLevel: number
  customInstructions: string
}

export const DEFAULT_CHAT_MODE_CUSTOM_SETTINGS: ChatModeCustomSettings = {
  temperatureLevel: DEFAULT_TEMPERATURE,
  customInstructions: '',
}

const TEMPERATURE_LABEL_KEYS = ['rationality', 'balance', 'creativity'] as const

type ChatModeCustomSheetProps = {
  open: boolean
  model: ChatModelDisplay | null
  models: ChatModelDisplay[]
  initialSettings?: ChatModeCustomSettings
  onClose: () => void
  onModelChange: (modelId: string) => void
  onConfirm: (settings: ChatModeCustomSettings) => void
  embedded?: boolean
}

function ModelSelector({
  model,
  models,
  onModelChange,
}: {
  model: ChatModelDisplay
  models: ChatModelDisplay[]
  onModelChange: (modelId: string) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <View style={styles.selectorContainer}>
      <Pressable
        onPress={() => setOpen(current => !current)}
        style={styles.selectorButton}
        accessibilityLabel={t('chatModeCustomSheet.selectModel')}
      >
        <Text style={styles.selectorLabel} numberOfLines={1}>
          {model.icon}
          {model.name}
        </Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Image
            source={{ uri: dialogAssets.dialogSettingsDownBack }}
            style={{ width: 16, height: 16 }}
          />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.dropdown}>
          {models.map((option, index) => {
            const active = option.modelId === model.modelId
            return (
              <View key={option.modelId}>
                {index > 0 ? <View style={styles.dropdownDivider} /> : null}
                <Pressable
                  onPress={() => {
                    onModelChange(option.modelId)
                    setOpen(false)
                  }}
                  style={styles.dropdownItem}
                >
                  <Text style={styles.dropdownIcon}>{option.icon}</Text>
                  <Text style={styles.dropdownName} numberOfLines={1}>
                    {option.name}
                  </Text>
                  {active ? <Text style={styles.dropdownCheck}>✓</Text> : null}
                </Pressable>
              </View>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

function TemperatureSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const { t } = useTranslation()
  const trackWidthRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPercent, setDragPercent] = useState<number | null>(null)

  const percentFromX = (locationX: number): number => {
    const width = trackWidthRef.current
    if (width <= 0) return 0
    const ratio = locationX / width
    return Math.min(100, Math.max(0, ratio * 100))
  }

  const previewValue =
    isDragging && dragPercent !== null ? percentToTemperature(dragPercent) : clampTemperature(value)
  const labelKey =
    TEMPERATURE_LABEL_KEYS[getNearestTemperatureAnchorIndex(previewValue)] ?? 'balance'
  const thumbPercent = isDragging && dragPercent !== null ? dragPercent : temperatureToPercent(value)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        setIsDragging(true)
        setDragPercent(percentFromX(event.nativeEvent.locationX))
      },
      onPanResponderMove: (event: GestureResponderEvent) => {
        setDragPercent(percentFromX(event.nativeEvent.locationX))
      },
      onPanResponderRelease: (event: GestureResponderEvent) => {
        const percent = percentFromX(event.nativeEvent.locationX)
        onChange(percentToTemperature(percent))
        setIsDragging(false)
        setDragPercent(null)
      },
      onPanResponderTerminate: () => {
        setIsDragging(false)
        setDragPercent(null)
      },
    }),
  ).current

  const onTrackLayout = (event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('chatModeCustomSheet.dialogueLabel')}</Text>
      <View
        style={styles.sliderInset}
        accessibilityRole="adjustable"
        accessibilityValue={{ text: t(`chatModeCustomSheet.creativityLevels.${labelKey}`) }}
      >
        <View
          style={styles.sliderTrack}
          onLayout={onTrackLayout}
          {...panResponder.panHandlers}
        >
          <View style={styles.sliderRail} />
          <View style={[styles.sliderThumb, { left: `${thumbPercent}%` }]} />
        </View>
        <View style={styles.sliderLabelsRow}>
          <Text style={styles.sliderEndLabel}>
            {t('chatModeCustomSheet.creativityLevels.rationality')}
          </Text>
          <Text style={styles.sliderEndLabel}>
            {t('chatModeCustomSheet.creativityLevels.creativity')}
          </Text>
        </View>
      </View>
    </View>
  )
}

export function ChatModeCustomSheet({
  open,
  model,
  models,
  initialSettings = DEFAULT_CHAT_MODE_CUSTOM_SETTINGS,
  onClose,
  onModelChange,
  onConfirm,
  embedded = false,
}: ChatModeCustomSheetProps) {
  const { t } = useTranslation()
  const [draftSettings, setDraftSettings] = useState<ChatModeCustomSettings>(initialSettings)

  useEffect(() => {
    if (!open) return
    setDraftSettings(initialSettings)
  }, [open, initialSettings.temperatureLevel, initialSettings.customInstructions])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      embedded={embedded}
      embeddedZIndex={60}
      fitContent
      header={
        model ? (
          <View style={styles.header}>
            <ModelSelector model={model} models={models} onModelChange={onModelChange} />
          </View>
        ) : null
      }
      footer={
        <Pressable style={styles.confirmButton} onPress={() => onConfirm(draftSettings)}>
          <Text style={styles.confirmText}>{t('chatModeCustomSheet.confirm')}</Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        <TemperatureSlider
          value={draftSettings.temperatureLevel}
          onChange={temperatureLevel =>
            setDraftSettings(current => ({
              ...current,
              temperatureLevel: clampTemperature(temperatureLevel),
            }))
          }
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('chatModeCustomSheet.instructionsLabel')}</Text>
          <TextInput
            value={draftSettings.customInstructions}
            maxLength={CUSTOM_INSTRUCTIONS_MAX_LENGTH}
            onChangeText={text =>
              setDraftSettings(current => ({
                ...current,
                customInstructions: text.slice(0, CUSTOM_INSTRUCTIONS_MAX_LENGTH),
              }))
            }
            placeholder={t('chatModeCustomSheet.instructionsPlaceholder')}
            placeholderTextColor="rgba(0,0,0,0.2)"
            style={styles.textarea}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
  },
  content: {
    gap: 24,
    paddingHorizontal: 12,
    paddingBottom: 12,
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
  selectorContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectorLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  dropdown: {
    position: 'absolute',
    left: 0,
    top: '100%',
    marginTop: 4,
    zIndex: 30,
    minWidth: 220,
    maxHeight: 240,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 12,
  },
  dropdownDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
  },
  dropdownIcon: {
    fontSize: 24,
  },
  dropdownName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  dropdownCheck: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  sliderInset: {
    paddingHorizontal: 8,
  },
  sliderTrack: {
    height: 20,
    justifyContent: 'center',
  },
  sliderRail: {
    height: 6,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sliderThumb: {
    position: 'absolute',
    top: '50%',
    width: 12,
    height: 20,
    marginLeft: -6,
    marginTop: -10,
    borderRadius: 999,
    backgroundColor: '#000000',
  },
  sliderLabelsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderEndLabel: {
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
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
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
