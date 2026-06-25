import { useCallback, useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { fetchCharacterGalleryImages } from '@/features/character/api/fetch-character-gallery-images'
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload'
import { addCharacterCreateAssets } from '@/shared/assets/character/add-character'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { Image } from 'expo-image'
import { PopImage } from '@/shared/ui/pop-image'
import {
  SheetBody,
  SheetEmpty,
  SheetFooterButton,
  SheetHeader,
  SheetRetry,
} from '@/shared/ui/sheet-primitives'

type CharacterGalleryPickerSheetProps = {
  open: boolean
  characterId: string
  maxSelectable: number
  onClose: () => void
  onConfirm: (urls: string[]) => void
}

/** 角色图库选择：数据来自 character detail 的 album / 形象照片 */
export function CharacterGalleryPickerSheet({
  open,
  characterId,
  maxSelectable,
  onClose,
  onConfirm,
}: CharacterGalleryPickerSheetProps) {
  const { t } = useTranslation()
  const [images, setImages] = useState<string[]>([])
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const checkIconUri = addCharacterCreateAssets.check

  const loadImages = useCallback(async () => {
    if (!characterId) {
      setImages([])
      return
    }

    setLoading(true)
    setError(false)
    try {
      const urls = await fetchCharacterGalleryImages(characterId)
      setImages(urls)
    } catch {
      setImages([])
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [characterId])

  useEffect(() => {
    if (!open) {
      setSelectedUrls([])
      setImages([])
      setError(false)
      return
    }

    void loadImages()
  }, [open, loadImages])

  const toggleSelect = (url: string) => {
    setSelectedUrls((prev) => {
      if (prev.includes(url)) {
        return prev.filter((item) => item !== url)
      }
      if (prev.length >= maxSelectable) return prev
      return [...prev, url]
    })
  }

  const handleConfirm = () => {
    if (!selectedUrls.length) return
    onConfirm(selectedUrls)
    onClose()
  }

  const selectedCount = selectedUrls.length

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={
        <SheetHeader title={t('character.createPage.imagePickerGalleryTitle')} />
      }
      footer={
        <SheetFooterButton
          label={t('character.createPage.imagePickerConfirm', {
            count: selectedCount,
            max: maxSelectable,
          })}
          disabled={selectedCount === 0}
          onPress={handleConfirm}
        />
      }
    >
      <SheetBody style={styles.content}>
        {loading ? (
          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.skeletonItem} />
            ))}
          </View>
        ) : error ? (
          <SheetRetry
            message={t('character.createPage.imagePickerLoadFailed')}
            retryLabel={t('character.creation.retry')}
            onRetry={() => void loadImages()}
          />
        ) : images.length === 0 ? (
          <SheetEmpty message={t('character.createPage.imagePickerEmpty')} />
        ) : (
          <View style={styles.grid}>
            {images.map((url) => {
              const selected = selectedUrls.includes(url)
              const disabled = !selected && selectedCount >= maxSelectable

              return (
                <Pressable
                  key={url}
                  disabled={disabled}
                  onPress={() => toggleSelect(url)}
                  style={[styles.imageButton, disabled && styles.imageButtonDisabled]}
                >
                  <PopImage uri={resolveTosAssetUrl(url)} style={styles.image} contentFit="cover" />
                  <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
                    {selected ? <Image source={{ uri: checkIconUri }} style={{ width: 14, height: 14 }} /> : null}
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}
      </SheetBody>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  imageButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#efefef',
  },
  imageButtonDisabled: {
    opacity: 0.4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  checkCircle: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
})
