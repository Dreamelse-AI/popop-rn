import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, Modal, ActivityIndicator, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'

import { fetchCharacterGalleryImages } from '@/features/character/api/fetch-character-gallery-images'
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload'

type CharacterGalleryPickerSheetProps = {
  open: boolean
  characterId: string
  maxSelectable: number
  onClose: () => void
  onConfirm: (urls: string[]) => void
}

export function CharacterGalleryPickerSheet({
  open,
  characterId,
  maxSelectable,
  onClose,
  onConfirm,
}: CharacterGalleryPickerSheetProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [images, setImages] = useState<string[]>([])
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

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
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('character.createPage.imagePickerGalleryTitle')}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
                      <Image
                        source={{ uri: resolveTosAssetUrl(url) }}
                        style={styles.image}
                        contentFit="cover"
                      />
                      <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
                        {selected && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
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
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#f7f7f7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
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
  checkMark: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
