import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { fetchCharacterGalleryImages } from '@/features/character/api/fetch-character-gallery-images'
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload'
import { addCharacterCreateAssets } from '@/shared/assets/character/add-character'
import { dialogPageStyleSettingsAssets } from '@/shared/assets/dialog/dialog-page-style-settings'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { PopIcon } from '@/shared/ui/pop-icon'
import { PopImage } from '@/shared/ui/pop-image'

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

  const CheckIcon = addCharacterCreateAssets.check

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
      closeIcon={<PopIcon icon={dialogPageStyleSettingsAssets.close} size={28} />}
      header={
        <View style={styles.header}>
          <Text style={styles.title}>{t('character.createPage.imagePickerGalleryTitle')}</Text>
        </View>
      }
      footer={
        <Pressable
          disabled={selectedCount === 0}
          onPress={handleConfirm}
          style={[styles.confirmButton, selectedCount === 0 && styles.confirmButtonDisabled]}
        >
          <Text style={styles.confirmText}>
            {t('character.createPage.imagePickerConfirm', {
              count: selectedCount,
              max: maxSelectable,
            })}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        {loading ? (
          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.skeletonItem} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('character.createPage.imagePickerLoadFailed')}</Text>
            <Pressable onPress={() => void loadImages()} style={styles.retryButton}>
              <Text style={styles.retryText}>{t('character.creation.retry')}</Text>
            </Pressable>
          </View>
        ) : images.length === 0 ? (
          <Text style={styles.emptyText}>{t('character.createPage.imagePickerEmpty')}</Text>
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
                    {selected ? <CheckIcon width={14} height={14} /> : null}
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  errorContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  emptyText: {
    paddingVertical: 48,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
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
  confirmButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
