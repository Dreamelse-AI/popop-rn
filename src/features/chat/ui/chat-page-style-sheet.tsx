import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  BUBBLE_STYLE_TOKENS,
  DEFAULT_CHAT_ATMOSPHERE,
  getBackgroundPreview,
  type BubbleStyleId,
  type ChatAtmosphereConfig,
} from '@/features/chat/lib/chat-atmosphere-presets'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { SheetBody, SheetFooterButton, SheetHeader } from '@/shared/ui/sheet-primitives'

import { ChatBackgroundPage } from './chat-background-page'
import { Image } from 'expo-image'

type ChatPageStyleSheetProps = {
  open: boolean
  initialConfig?: ChatAtmosphereConfig
  onClose: () => void
  onConfirm?: (config: ChatAtmosphereConfig) => void | Promise<void>
  embedded?: boolean
}

const BUBBLE_STYLE_IDS: BubbleStyleId[] = ['classic', 'dark', 'blue']

export function ChatPageStyleSheet({
  open,
  initialConfig = DEFAULT_CHAT_ATMOSPHERE,
  onClose,
  onConfirm,
  embedded = false,
}: ChatPageStyleSheetProps) {
  const { t } = useTranslation()
  const [draftConfig, setDraftConfig] = useState<ChatAtmosphereConfig>(initialConfig)
  const [backgroundPageOpen, setBackgroundPageOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const currentBackgroundPreview = getBackgroundPreview(draftConfig.backgroundId)

  useEffect(() => {
    if (!open) return
    setDraftConfig(initialConfig)
    setBackgroundPageOpen(false)
    setConfirming(false)
  }, [open, initialConfig])

  const handleConfirm = async () => {
    if (confirming) return
    setConfirming(true)
    try {
      await onConfirm?.(draftConfig)
      onClose()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        embedded={embedded}
        embeddedZIndex={60}
        scrollable={false}
        header={<SheetHeader title={t('chatPageStyleSheet.title')} />}
        footer={
          <SheetFooterButton
            label={t('chatPageStyleSheet.confirm')}
            onPress={() => void handleConfirm()}
            disabled={confirming}
            loading={confirming}
          />
        }
      >
        <SheetBody>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Background */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('chatPageStyleSheet.chatBackground')}</Text>
              <Pressable onPress={() => setBackgroundPageOpen(true)} style={styles.backgroundCard}>
                {currentBackgroundPreview.previewImage ? (
                  <Image source={{ uri: currentBackgroundPreview.previewImage }} style={styles.backgroundPreview} />
                ) : (
                  <View style={[styles.backgroundPreview, { backgroundColor: currentBackgroundPreview.color ?? '#fbf2d8' }]} />
                )}
              </Pressable>
            </View>

            {/* Bubble style */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('chatPageStyleSheet.chatBubble')}</Text>
              <View style={styles.bubbleRow}>
                {BUBBLE_STYLE_IDS.map(id => {
                  const selected = draftConfig.bubbleStyleId === id
                  const tokens = BUBBLE_STYLE_TOKENS[id]
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setDraftConfig(prev => ({ ...prev, bubbleStyleId: id }))}
                      style={[styles.bubbleCard, selected && styles.bubbleCardSelected]}
                    >
                      <View style={[styles.bubblePreviewReceived, { backgroundColor: tokens.received.bgColor }]} />
                      <View style={[styles.bubblePreviewSent, { backgroundColor: tokens.sent.bgColor }]} />
                    </Pressable>
                  )
                })}
              </View>
            </View>
          </ScrollView>
        </SheetBody>
      </BottomSheet>

      <ChatBackgroundPage
        open={backgroundPageOpen}
        selectedBackgroundId={draftConfig.backgroundId}
        onBack={() => setBackgroundPageOpen(false)}
        onSelectBackground={backgroundId => setDraftConfig(prev => ({ ...prev, backgroundId }))}
      />
    </>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    gap: 24,
    paddingVertical: 12,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  backgroundCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    padding: 12,
    alignItems: 'center',
  },
  backgroundPreview: {
    width: 135,
    height: 240,
    borderRadius: 16,
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  bubbleCard: {
    flex: 1,
    height: 116,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 12,
    justifyContent: 'space-between',
  },
  bubbleCardSelected: {
    borderWidth: 3,
    borderColor: '#000000',
  },
  bubblePreviewReceived: {
    width: '70%',
    height: 32,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  bubblePreviewSent: {
    width: '70%',
    height: 32,
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
})
