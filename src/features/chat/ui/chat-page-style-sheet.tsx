import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useTranslation } from 'react-i18next'
import { cdnImage } from '@/shared/lib/cdn'

import {
  BUBBLE_STYLE_TOKENS,
  CUSTOM_THEMES,
  DEFAULT_CHAT_ATMOSPHERE,
  getBackgroundPreview,
  type BubbleStyleId,
  type ChatAtmosphereConfig,
} from '@/features/chat/lib/chat-atmosphere-presets'
import { dialogPageStyleSettingsAssets } from '@/shared/assets/dialog/dialog-page-style-settings'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { PopIcon } from '@/shared/ui/pop-icon'
import { PopImage } from '@/shared/ui/pop-image'
import { SheetBody, SheetFooterButton, SheetHeader } from '@/shared/ui/sheet-primitives'

const IconUnion = cdnImage('assets/dialog/dialog-page-style-settings/dialogPageStyleSettings-union.png')

import { BubbleTail } from './bubble-tail'
import { ChatBackgroundPage } from './chat-background-page'

type ChatPageStyleSheetProps = {
  open: boolean
  initialConfig?: ChatAtmosphereConfig
  onClose: () => void
  onConfirm?: (config: ChatAtmosphereConfig) => void | Promise<void>
  embedded?: boolean
}

type BubbleStyleOption = {
  id: BubbleStyleId
  received: { type: 'union' | 'solid'; color?: string; tail?: 'blue' }
  sent: { color: string; tail: 'yellow' | 'black' }
}

const BUBBLE_STYLE_OPTIONS: BubbleStyleOption[] = [
  {
    id: 'classic',
    received: { type: 'union' },
    sent: { color: BUBBLE_STYLE_TOKENS.classic.sent.bgColor, tail: 'yellow' },
  },
  {
    id: 'dark',
    received: { type: 'union' },
    sent: { color: BUBBLE_STYLE_TOKENS.dark.sent.bgColor, tail: 'black' },
  },
  {
    id: 'blue',
    received: { type: 'solid', color: BUBBLE_STYLE_TOKENS.blue.received.bgColor, tail: 'blue' },
    sent: { color: BUBBLE_STYLE_TOKENS.blue.sent.bgColor, tail: 'yellow' },
  },
]

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>
}

function ReceivedBubblePreview({ option }: { option: BubbleStyleOption['received'] }) {
  if (option.type === 'union') {
    return (
      <View style={styles.receivedBubbleRow}>
        <View style={styles.unionBubble}>
          <Image source={{ uri: IconUnion }} style={{width: 92, height: 42}} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.receivedBubbleRow}>
      <View style={[styles.solidBubble, { backgroundColor: option.color }]}>
        <BubbleTail variant="blue" side="right" style={styles.previewTail} />
      </View>
    </View>
  )
}

function SentBubblePreview({ option }: { option: BubbleStyleOption['sent'] }) {
  return (
    <View style={styles.receivedBubbleRow}>
      <View style={[styles.solidBubble, { backgroundColor: option.color }]}>
        <BubbleTail variant={option.tail} side="right" style={styles.previewTail} />
      </View>
    </View>
  )
}

function BubbleStyleCard({
  option,
  selected,
  onSelect,
}: {
  option: BubbleStyleOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.bubbleCard, selected && styles.bubbleCardSelected]}
    >
      <View style={styles.bubbleCardInner}>
        <ReceivedBubblePreview option={option.received} />
        <SentBubblePreview option={option.sent} />
      </View>
    </Pressable>
  )
}

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
  const backgroundPreview = getBackgroundPreview(draftConfig.backgroundId)

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
        open={open && !backgroundPageOpen}
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
        <SheetBody style={styles.body}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Background */}
            <View style={styles.section}>
              <SectionLabel>{t('chatPageStyleSheet.chatBackground')}</SectionLabel>
              <View style={styles.backgroundCard}>
                <View style={styles.backgroundPreviewWrap}>
                  {backgroundPreview.previewSource ? (
                    <PopImage
                      source={backgroundPreview.previewSource}
                      contentFit="cover"
                      recyclingKey={draftConfig.backgroundId}
                      style={styles.backgroundPreview}
                    />
                  ) : (
                    <View
                      style={[
                        styles.backgroundPreview,
                        { backgroundColor: backgroundPreview.color ?? '#fbf2d8' },
                      ]}
                    />
                  )}
                </View>
                <Pressable
                  onPress={() => setBackgroundPageOpen(true)}
                  style={styles.backgroundArrow}
                  accessibilityLabel={t('chatPageStyleSheet.viewAllBackgrounds')}
                >
                  <PopIcon icon={dialogPageStyleSettingsAssets.greyBack} size={24} />
                </Pressable>
              </View>
            </View>

            {/* Bubble style */}
            <View style={styles.section}>
              <SectionLabel>{t('chatPageStyleSheet.chatBubble')}</SectionLabel>
              <View style={styles.bubbleRow}>
                {BUBBLE_STYLE_OPTIONS.map(option => (
                  <BubbleStyleCard
                    key={option.id}
                    option={option}
                    selected={draftConfig.bubbleStyleId === option.id}
                    onSelect={() =>
                      setDraftConfig(prev => ({ ...prev, bubbleStyleId: option.id }))
                    }
                  />
                ))}
              </View>
            </View>

            {/* Custom themes */}
            <View style={styles.section}>
              <View style={styles.themeSectionHeader}>
                <SectionLabel>{t('chatPageStyleSheet.customTheme')}</SectionLabel>
                <Pressable style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>{t('chatPageStyleSheet.viewAll')}</Text>
                  <PopIcon icon={dialogPageStyleSettingsAssets.blackBack} size={16} />
                </Pressable>
              </View>
              <View style={styles.themeGrid}>
                {CUSTOM_THEMES.map(theme => (
                  <View key={theme.id} style={styles.themeCard}>
                    <PopImage source={theme.image} contentFit="cover" style={styles.themeImage} />
                  </View>
                ))}
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
  body: {
    paddingBottom: 0,
  },
  scrollView: {
    maxHeight: 520,
  },
  scrollContent: {
    gap: 16,
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
  backgroundCard: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    padding: 12,
    overflow: 'hidden',
  },
  backgroundPreviewWrap: {
    alignItems: 'center',
  },
  backgroundPreview: {
    width: 135,
    height: 240,
    borderRadius: 16,
  },
  backgroundArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleRow: {
    flexDirection: 'row',
    gap: 9,
  },
  bubbleCard: {
    width: 116,
    height: 116,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleCardSelected: {
    borderWidth: 3,
    borderColor: '#000000',
  },
  bubbleCardInner: {
    width: '100%',
    height: 92,
    justifyContent: 'space-between',
  },
  receivedBubbleRow: {
    width: '100%',
    alignItems: 'flex-end',
  },
  unionBubble: {
    transform: [{ scaleY: -1 }, { rotate: '180deg' }],
  },
  solidBubble: {
    position: 'relative',
    width: 92,
    height: 42,
    borderRadius: 24,
    overflow: 'visible',
  },
  previewTail: {
    bottom: -9,
    top: undefined,
  },
  themeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: 'Black Han Sans',
    color: '#000000',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    rowGap: 8,
  },
  themeCard: {
    width: '31%',
    aspectRatio: 116 / 208,
    borderRadius: 16,
    overflow: 'hidden',
  },
  themeImage: {
    width: '100%',
    height: '100%',
  },
})
