import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { ChatBackgroundUploadResult } from '@/features/chat/lib/chat-background-upload'
import {
  getAllBackgrounds,
  PRESET_BACKGROUNDS,
  type BackgroundItem,
} from '@/features/chat/lib/chat-atmosphere-presets'
import {
  appendCustomBackground,
  removeCustomBackground,
  type StoredCustomBackground,
} from '@/features/chat/lib/chat-background-store'

import { ChatLocalAlbumSheet } from './chat-local-album-sheet'
import { Image } from 'expo-image'

type ChatBackgroundPageProps = {
  open: boolean
  selectedBackgroundId?: string
  onBack: () => void
  onSelectBackground?: (id: string) => void
}

export function ChatBackgroundPage({
  open,
  selectedBackgroundId = 'yellow',
  onBack,
  onSelectBackground,
}: ChatBackgroundPageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [draftSelectedId, setDraftSelectedId] = useState(selectedBackgroundId)
  const [allBackgrounds, setAllBackgrounds] = useState<BackgroundItem[]>(PRESET_BACKGROUNDS)
  const [albumSheetOpen, setAlbumSheetOpen] = useState(false)

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel={t('chatBackgroundPage.back')}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </Pressable>
        <Text style={styles.title}>{t('chatBackgroundPage.title')}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.grid}>
        {allBackgrounds.map(item => (
          <Pressable
            key={item.id}
            onPress={() => handleSelect(item.id)}
            style={[styles.card, draftSelectedId === item.id && styles.cardSelected]}
          >
            {item.type === 'color' ? (
              <View style={[styles.cardInner, { backgroundColor: item.color }]} />
            ) : (
              <Image source={{ uri: item.image }} style={styles.cardInner} />
            )}
          </Pressable>
        ))}

        <Pressable
          onPress={() => setAlbumSheetOpen(true)}
          style={styles.addCard}
          accessibilityLabel={t('chatBackgroundPage.addBackground')}
        >
          <Text style={styles.addIcon}>+</Text>
        </Pressable>
      </ScrollView>

      <ChatLocalAlbumSheet
        open={albumSheetOpen}
        onClose={() => setAlbumSheetOpen(false)}
        onSelectPhoto={handleSelectPhoto}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
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
    gap: 9,
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  card: {
    width: '31%',
    height: 208,
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
  addCard: {
    width: '31%',
    height: 208,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 32,
    color: 'rgba(0,0,0,0.3)',
  },
})
