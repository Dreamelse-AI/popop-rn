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

import { ChatBackgroundPage } from './chat-background-page'
import { Image } from 'expo-image'

type ChatPageStyleSheetProps = {
  open: boolean
  initialConfig?: ChatAtmosphereConfig
  onClose: () => void
  onConfirm?: (config: ChatAtmosphereConfig) => void | Promise<void>
}

const BUBBLE_STYLE_IDS: BubbleStyleId[] = ['classic', 'dark', 'blue']

export function ChatPageStyleSheet({
  open,
  initialConfig = DEFAULT_CHAT_ATMOSPHERE,
  onClose,
  onConfirm,
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
      <BottomSheet open={open} onClose={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('chatPageStyleSheet.title')}</Text>
            <View style={styles.headerDivider} />
          </View>

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

          <Pressable
            onPress={() => void handleConfirm()}
            disabled={confirming}
            style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
          >
            <Text style={styles.confirmText}>{t('chatPageStyleSheet.confirm')}</Text>
          </Pressable>
        </View>
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
  confirmButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
