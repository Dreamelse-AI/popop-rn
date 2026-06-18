import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { ChatBackgroundUploadResult } from '@/features/chat/lib/chat-background-upload'
import {
  getImageUploadErrorMessage,
  pickAndUploadImages,
} from '@/features/chat/lib/pick-and-upload-images'
import {
  getAllBackgrounds,
  PRESET_BACKGROUNDS,
  type BackgroundItem,
} from '@/features/chat/lib/chat-atmosphere-presets'
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload'
import {
  appendCustomBackground,
  removeCustomBackground,
  type StoredCustomBackground,
} from '@/features/chat/lib/chat-background-store'
import { dialogPageStyleSettingsAssets } from '@/shared/assets/dialog/dialog-page-style-settings'
import AddCardIcon from '@/shared/assets/dialog/dialog-page-style-settings/dialogPageStyleSettings-add.svg'
import { FullscreenPage, PageHeaderBar } from '@/shared/ui/fullscreen-page'
import { PopIcon } from '@/shared/ui/pop-icon'
import { PopImage } from '@/shared/ui/pop-image'
import { Toast, useToast } from '@/shared/ui/toast'

const GRID_GAP = 9
const GRID_PADDING_H = 12
const CARD_HEIGHT = 208
const NUM_COLUMNS = 3

type ChatBackgroundPageProps = {
  open: boolean
  selectedBackgroundId?: string
  onBack: () => void
  onSelectBackground?: (id: string) => void
}

type BackgroundCardProps = {
  item: BackgroundItem
  selected: boolean
  cardWidth: number
  onSelect: () => void
  onDelete?: () => void
  deleteLabel: string
}

function BackgroundCard({
  item,
  selected,
  cardWidth,
  onSelect,
  onDelete,
  deleteLabel,
}: BackgroundCardProps) {
  return (
    <View style={[styles.cardWrap, { width: cardWidth }]}>
      <Pressable
        onPress={onSelect}
        style={[styles.card, selected && styles.cardSelected, { width: cardWidth, height: CARD_HEIGHT }]}
      >
        {item.type === 'color' ? (
          <View style={[styles.cardInner, { backgroundColor: item.color }]} />
        ) : typeof item.image === 'number' ? (
          <PopImage source={item.image} style={styles.cardInner} contentFit="cover" />
        ) : (
          <PopImage uri={resolveTosAssetUrl(item.image)} style={styles.cardInner} contentFit="cover" />
        )}
      </Pressable>

      {item.type === 'custom' && onDelete ? (
        <Pressable
          onPress={onDelete}
          style={styles.deleteButton}
          accessibilityLabel={deleteLabel}
        >
          <PopIcon icon={dialogPageStyleSettingsAssets.delete} size={24} />
        </Pressable>
      ) : null}
    </View>
  )
}

export function ChatBackgroundPage({
  open,
  selectedBackgroundId = 'yellow',
  onBack,
  onSelectBackground,
}: ChatBackgroundPageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { width: windowWidth } = useWindowDimensions()
  const { toast, showToast } = useToast()
  const [draftSelectedId, setDraftSelectedId] = useState(selectedBackgroundId)
  const [allBackgrounds, setAllBackgrounds] = useState<BackgroundItem[]>(PRESET_BACKGROUNDS)
  const [uploading, setUploading] = useState(false)

  const contentWidth = Math.min(windowWidth, 390)
  const cardWidth =
    (contentWidth - GRID_PADDING_H * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

  useEffect(() => {
    if (!open) return
    setDraftSelectedId(selectedBackgroundId)
    setAllBackgrounds(getAllBackgrounds())
  }, [open, selectedBackgroundId])

  if (!open) return null

  const handleSelect = (id: string) => {
    setDraftSelectedId(id)
    onSelectBackground?.(id)
  }

  const handleDeleteCustom = (id: string) => {
    removeCustomBackground(id)
    const nextBackgrounds = getAllBackgrounds()
    setAllBackgrounds(nextBackgrounds)

    if (draftSelectedId === id) {
      const nextId = PRESET_BACKGROUNDS[0]!.id
      setDraftSelectedId(nextId)
      onSelectBackground?.(nextId)
    }
  }

  const handleSelectPhoto = ({ imageUrl, bkgMainColor }: ChatBackgroundUploadResult) => {
    const newBackground: StoredCustomBackground = {
      id: `custom-${Date.now()}`,
      image: imageUrl,
      bkgMainColor,
    }
    appendCustomBackground(newBackground)
    const nextBackgrounds = getAllBackgrounds()
    setAllBackgrounds(nextBackgrounds)
    setDraftSelectedId(newBackground.id)
    onSelectBackground?.(newBackground.id)
  }

  const handlePickBackground = async () => {
    if (uploading) return

    setUploading(true)
    try {
      const results = await pickAndUploadImages({ scene: 'chatBackground' })
      const uploaded = results[0]
      if (uploaded) {
        handleSelectPhoto(uploaded)
      }
    } catch (error) {
      showToast(getImageUploadErrorMessage(error, t))
    } finally {
      setUploading(false)
    }
  }

  return (
    <FullscreenPage backgroundColor="#f6f6f6" zIndex={70}>
      <PageHeaderBar>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel={t('chatBackgroundPage.back')}
        >
          <PopIcon icon={dialogPageStyleSettingsAssets.back} size={36} />
        </Pressable>
        <Text style={styles.title}>{t('chatBackgroundPage.title')}</Text>
      </PageHeaderBar>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {allBackgrounds.map(item => (
          <BackgroundCard
            key={item.id}
            item={item}
            selected={draftSelectedId === item.id}
            cardWidth={cardWidth}
            onSelect={() => handleSelect(item.id)}
            onDelete={
              item.type === 'custom' ? () => handleDeleteCustom(item.id) : undefined
            }
            deleteLabel={t('chatBackgroundPage.deleteBackground')}
          />
        ))}

        <Pressable
          onPress={() => void handlePickBackground()}
          disabled={uploading}
          style={[styles.addCard, { width: cardWidth, height: CARD_HEIGHT }]}
          accessibilityLabel={t('chatBackgroundPage.addBackground')}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="rgba(0,0,0,0.3)" />
          ) : (
            <AddCardIcon width={cardWidth} height={CARD_HEIGHT} />
          )}
        </Pressable>
      </ScrollView>

      <Toast message={toast} />
    </FullscreenPage>
  )
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  title: {
    fontSize: 20,
    lineHeight: 21,
    fontFamily: 'Black Han Sans',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: GRID_PADDING_H,
    paddingTop: 12,
    alignSelf: 'center',
    maxWidth: 390,
    width: '100%',
  },
  cardWrap: {
    position: 'relative',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  cardInner: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  addCard: {
    borderRadius: 16,
    overflow: 'hidden',
    opacity: 1,
  },
})
