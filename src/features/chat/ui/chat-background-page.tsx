import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
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
  resolveImageAssetSource,
  type BackgroundItem,
} from '@/features/chat/lib/chat-atmosphere-presets'
import {
  appendCustomBackground,
  removeCustomBackground,
  type StoredCustomBackground,
} from '@/features/chat/lib/chat-background-store'
import { dialogPageStyleSettingsAssets } from '@/shared/assets/dialog/dialog-page-style-settings'
import { cdnImage } from '@/shared/lib/cdn'
import { PageHeaderBar } from '@/shared/ui/fullscreen-page'

import { PopImage } from '@/shared/ui/pop-image'
import { Toast, useToast } from '@/shared/ui/toast'

const AddCardIcon = cdnImage('assets/dialog/dialog-page-style-settings/dialogPageStyleSettings-add.png')

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

type GridCell = BackgroundItem | { id: '__add__'; type: 'add' }

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
        ) : (
          <PopImage
            source={resolveImageAssetSource(item.image)}
            style={styles.cardInner}
            contentFit="cover"
          />
        )}
      </Pressable>

      {item.type === 'custom' && onDelete ? (
        <Pressable
          onPress={onDelete}
          style={styles.deleteButton}
          accessibilityLabel={deleteLabel}
        >
          <Image source={{ uri: dialogPageStyleSettingsAssets.delete }} style={{width: 24, height: 24}} />
        </Pressable>
      ) : null}
    </View>
  )
}

function chunkGridCells(items: BackgroundItem[]): GridCell[][] {
  const cells: GridCell[] = [...items, { id: '__add__', type: 'add' }]
  const rows: GridCell[][] = []

  for (let index = 0; index < cells.length; index += NUM_COLUMNS) {
    rows.push(cells.slice(index, index + NUM_COLUMNS))
  }

  return rows
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

  const gridRows = useMemo(() => chunkGridCells(allBackgrounds), [allBackgrounds])

  useEffect(() => {
    if (!open) return
    setDraftSelectedId(selectedBackgroundId)
    setAllBackgrounds(getAllBackgrounds())
  }, [open, selectedBackgroundId])

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
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onBack}
    >
      <View style={styles.page}>
        <PageHeaderBar>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityLabel={t('chatBackgroundPage.back')}
          >
            <Image source={{ uri: dialogPageStyleSettingsAssets.back }} style={{width: 36, height: 36}} />
          </Pressable>
          <Text style={styles.title}>{t('chatBackgroundPage.title')}</Text>
        </PageHeaderBar>

        <FlatList
          data={gridRows}
          keyExtractor={(_, index) => `background-row-${index}`}
          style={styles.list}
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: row }) => (
            <View style={[styles.row, { maxWidth: contentWidth }]}>
              {row.map(cell =>
                cell.type === 'add' ? (
                  <Pressable
                    key={cell.id}
                    onPress={() => void handlePickBackground()}
                    disabled={uploading}
                    style={[styles.addCard, { width: cardWidth, height: CARD_HEIGHT }]}
                    accessibilityLabel={t('chatBackgroundPage.addBackground')}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color="rgba(0,0,0,0.3)" />
                    ) : (
                      <Image source={{ uri: AddCardIcon }} style={{width: cardWidth, height: CARD_HEIGHT}} />
                    )}
                  </Pressable>
                ) : (
                  <BackgroundCard
                    key={cell.id}
                    item={cell}
                    selected={draftSelectedId === cell.id}
                    cardWidth={cardWidth}
                    onSelect={() => handleSelect(cell.id)}
                    onDelete={
                      cell.type === 'custom' ? () => handleDeleteCustom(cell.id) : undefined
                    }
                    deleteLabel={t('chatBackgroundPage.deleteBackground')}
                  />
                ),
              )}
              {row.length < NUM_COLUMNS
                ? Array.from({ length: NUM_COLUMNS - row.length }, (_, index) => (
                    <View key={`spacer-${index}`} style={{ width: cardWidth }} />
                  ))
                : null}
            </View>
          )}
        />

        <Toast message={toast} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
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
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: GRID_GAP,
    paddingHorizontal: GRID_PADDING_H,
    marginBottom: GRID_GAP,
    alignSelf: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
})
