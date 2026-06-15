import { useCallback, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, Modal, ActivityIndicator, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'

import { CharacterAiImageFlow } from '@/features/character-creation/ui/character-ai-image-flow'
import { MusicPickerSheet } from '@/features/resource/ui/music-picker-sheet'
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload'

import {
  PostDynamicImageSourceSheet,
  type PostDynamicImageSource,
} from './post-dynamic-image-source-sheet'

const MAX_DYNAMIC_IMAGES = 9
const MAX_TEXT_LENGTH = 500

export type PostDynamicComposePayload = {
  text: string
  imageUrls: string[]
  musicId: string | null
}

type PostDynamicComposePageProps = {
  open: boolean
  characterId: string
  characterName: string
  onClose: () => void
  onPublish?: (payload: PostDynamicComposePayload) => void | Promise<void>
  publishing?: boolean
  onSystemAlbumUpload?: (uris: string[]) => Promise<string[]>
}

export function PostDynamicComposePage({
  open,
  characterId,
  characterName,
  onClose,
  onPublish,
  publishing = false,
  onSystemAlbumUpload,
}: PostDynamicComposePageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageSourceOpen, setImageSourceOpen] = useState(false)
  const [aiFlowOpen, setAiFlowOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [musicPickerOpen, setMusicPickerOpen] = useState(false)
  const [musicKey, setMusicKey] = useState<string | null>(null)
  const [musicTitle, setMusicTitle] = useState('')

  const canPublish = (text.trim().length > 0 || imageUrls.length > 0) && !uploading && !publishing

  const resetForm = useCallback(() => {
    setText('')
    setImageUrls([])
    setImageSourceOpen(false)
    setAiFlowOpen(false)
    setUploading(false)
    setMusicPickerOpen(false)
    setMusicKey(null)
    setMusicTitle('')
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const appendImages = useCallback((urls: string[]) => {
    if (!urls.length) return
    setImageUrls((prev) => {
      const room = MAX_DYNAMIC_IMAGES - prev.length
      return room > 0 ? [...prev, ...urls.slice(0, room)] : prev
    })
  }, [])

  const handleImageSourceSelect = useCallback(
    async (source: PostDynamicImageSource) => {
      if (source === 'ai') {
        setAiFlowOpen(true)
        return
      }

      if (source === 'gallery') {
        if (MAX_DYNAMIC_IMAGES - imageUrls.length <= 0) return
        // TODO: 接入 CharacterGalleryPickerSheet（阶段3完成后）
        return
      }

      const room = MAX_DYNAMIC_IMAGES - imageUrls.length
      if (room <= 0) return

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: room,
        quality: 0.8,
      })

      if (result.canceled || !result.assets.length) return

      const uris = result.assets.map(a => a.uri)
      setUploading(true)
      try {
        const urls = onSystemAlbumUpload
          ? await onSystemAlbumUpload(uris)
          : uris
        appendImages(urls)
      } finally {
        setUploading(false)
      }
    },
    [imageUrls.length, onSystemAlbumUpload, appendImages],
  )

  const handlePublish = async () => {
    if (!canPublish || !onPublish) return
    try {
      await onPublish({
        text: text.trim(),
        imageUrls,
        musicId: musicKey,
      })
      resetForm()
    } catch {
      // 失败时保留表单，由上层 toast
    }
  }

  if (!open) return null

  const showUploadPlaceholder = imageUrls.length === 0

  return (
    <>
      <Modal visible animationType="slide" onRequestClose={handleClose}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} disabled={publishing} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{t('character.creation.postUpdateTitle')}</Text>
              <Text style={styles.headerSubtitle}>{characterName}</Text>
            </View>
            <View style={styles.closeButton} />
          </View>

          {/* Content */}
          <ScrollView
            style={[styles.content, publishing && styles.contentDisabled]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {showUploadPlaceholder ? (
              <Pressable
                onPress={() => setImageSourceOpen(true)}
                disabled={uploading}
                style={styles.uploadPlaceholder}
              >
                <Text style={styles.uploadPlaceholderText}>
                  {uploading
                    ? t('character.createPage.imageUploading')
                    : t('character.creation.uploadImage')}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.imageGrid}>
                {imageUrls.map((url, index) => (
                  <View key={`${url}-${index}`} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: url.startsWith('file:') ? url : resolveTosAssetUrl(url) }}
                      style={styles.image}
                      contentFit="cover"
                    />
                    <Pressable
                      onPress={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
                      style={styles.imageDeleteButton}
                    >
                      <Text style={styles.imageDeleteText}>×</Text>
                    </Pressable>
                  </View>
                ))}
                {imageUrls.length < MAX_DYNAMIC_IMAGES && (
                  <Pressable
                    onPress={() => setImageSourceOpen(true)}
                    disabled={uploading}
                    style={styles.imageAddButton}
                  >
                    <Text style={styles.imageAddText}>+</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.textCard}>
              <Pressable onPress={() => setMusicPickerOpen(true)} style={styles.musicRow}>
                <Text style={styles.musicLabel}>{t('character.creation.musicPickerTitle')}</Text>
                <Text style={styles.musicValue} numberOfLines={1}>
                  {musicTitle || t('character.creation.musicPickerEmpty')}
                </Text>
              </Pressable>
              <TextInput
                value={text}
                onChangeText={(v) => setText(v.slice(0, MAX_TEXT_LENGTH))}
                placeholder={t('character.creation.dynamicDescriptionPlaceholder')}
                placeholderTextColor="rgba(0,0,0,0.25)"
                multiline
                style={styles.textInput}
              />
            </View>
          </ScrollView>

          {/* Publish button */}
          <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
            <Pressable
              disabled={!canPublish || publishing}
              onPress={() => void handlePublish()}
              style={[styles.publishButton, (!canPublish || publishing) && styles.publishButtonDisabled]}
            >
              {publishing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.publishButtonText}>{t('character.creation.publish')}</Text>
              )}
            </Pressable>
          </View>

          {/* Publishing overlay */}
          {publishing && (
            <View style={styles.publishingOverlay}>
              <View style={styles.publishingIndicator}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            </View>
          )}
        </View>
      </Modal>

      <MusicPickerSheet
        open={musicPickerOpen}
        value={musicKey}
        onClose={() => setMusicPickerOpen(false)}
        onSelect={music => {
          setMusicKey(music.music_key)
          setMusicTitle(music.title?.trim() || music.music_key)
        }}
        onClear={() => {
          setMusicKey(null)
          setMusicTitle('')
        }}
      />

      <PostDynamicImageSourceSheet
        open={imageSourceOpen}
        onClose={() => setImageSourceOpen(false)}
        onSelect={(source) => void handleImageSourceSelect(source)}
      />

      <CharacterAiImageFlow
        open={aiFlowOpen}
        onClose={() => setAiFlowOpen(false)}
        onConfirm={(url) => appendImages([url])}
        getGenerationContext={() => ({ mode: 'character', characterId })}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 24,
    color: '#000000',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  contentDisabled: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  contentContainer: {
    gap: 8,
    paddingBottom: 88,
  },
  uploadPlaceholder: {
    height: 292,
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 12,
  },
  imageWrapper: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#efefef',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageDeleteButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageDeleteText: {
    fontSize: 12,
    color: '#ffffff',
  },
  imageAddButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#efefef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAddText: {
    fontSize: 30,
    color: 'rgba(0,0,0,0.25)',
  },
  textCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  musicRow: {
    gap: 4,
  },
  musicLabel: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
  },
  musicValue: {
    fontSize: 14,
    color: '#000000',
  },
  textInput: {
    minHeight: 100,
    fontSize: 14,
    color: '#000000',
    textAlignVertical: 'top',
    padding: 0,
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  publishButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  publishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  publishingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'rgba(247,247,247,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishingIndicator: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
