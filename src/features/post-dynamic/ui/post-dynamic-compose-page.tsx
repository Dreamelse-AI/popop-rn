import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CharacterGalleryPickerSheet } from '@/features/character/ui/character-gallery-picker-sheet'
import { CharacterAiImageFlow } from '@/features/character-creation/ui/character-ai-image-flow'
import { MusicPickerSheet } from '@/features/resource/ui/music-picker-sheet'
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload'
import { SpinnerIcon } from '@/pages/character-creation/components/creation-icons'
import { addCharacterCreateAssets } from '@/shared/assets/character/add-character'
import { characterMainAssets } from '@/shared/assets/character/main'
import { FullscreenPage, PageHeaderBar } from '@/shared/ui/fullscreen-page'
import { Image } from 'expo-image'
import { PopImage } from '@/shared/ui/pop-image'

import { PostDynamicImagePickerSheet } from './post-dynamic-image-picker-sheet'

const MAX_DYNAMIC_IMAGES = 9
const MAX_TEXT_LENGTH = 500

export type PostDynamicComposePayload = {
  text: string
  imageUrls: string[]
  musicKey: string | null
}

type PostDynamicComposePageProps = {
  open: boolean
  characterId: string
  characterName: string
  onClose: () => void
  onPublish?: (payload: PostDynamicComposePayload) => void | Promise<void>
  publishing?: boolean
  onSystemAlbumUpload?: (uris: string[]) => Promise<string[]>
  /** 父级已处理顶部安全区时设为 false，避免重复留白 */
  includeSafeAreaTop?: boolean
}

export function PostDynamicComposePage({
  open,
  characterId,
  characterName,
  onClose,
  onPublish,
  publishing = false,
  onSystemAlbumUpload,
  includeSafeAreaTop = true,
}: PostDynamicComposePageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)
  const [aiFlowOpen, setAiFlowOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [musicPickerOpen, setMusicPickerOpen] = useState(false)
  const [musicKey, setMusicKey] = useState<string | null>(null)
  const [musicTitle, setMusicTitle] = useState('')

  const canPublish = (text.trim().length > 0 || imageUrls.length > 0) && !uploading && !publishing
  const galleryMaxSelectable = MAX_DYNAMIC_IMAGES - imageUrls.length

  const resetForm = useCallback(() => {
    setText('')
    setImageUrls([])
    setImagePickerOpen(false)
    setGalleryPickerOpen(false)
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

  const handleDeviceAlbumConfirm = useCallback(
    async (uris: string[]) => {
      if (!uris.length) return

      setUploading(true)
      try {
        const urls = onSystemAlbumUpload ? await onSystemAlbumUpload(uris) : uris
        appendImages(urls)
      } finally {
        setUploading(false)
      }
    },
    [appendImages, onSystemAlbumUpload],
  )

  const handlePublish = async () => {
    if (!canPublish || !onPublish) return
    try {
      await onPublish({
        text: text.trim(),
        imageUrls,
        musicKey,
      })
      resetForm()
    } catch {
      // 失败时保留表单，由上层 toast
    }
  }

  if (!open) return null

  const showUploadPlaceholder = imageUrls.length === 0
  const DefaultImageIcon = addCharacterCreateAssets.defaultImage

  return (
    <>
      <FullscreenPage backgroundColor="#f7f7f7">
        <PageHeaderBar includeSafeAreaTop={includeSafeAreaTop}>
          <Pressable
            onPress={handleClose}
            disabled={publishing}
            style={[styles.closeButton, publishing && styles.closeButtonDisabled]}
            accessibilityLabel={t('character.detailPage.back')}
          >
            <Image source={{ uri: characterMainAssets.iconClose }} style={{width: 24, height: 24}} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t('character.creation.postUpdateTitle')}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {characterName}
            </Text>
          </View>
        </PageHeaderBar>

        <ScrollView
          style={[styles.content, publishing && styles.contentDisabled]}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: Math.max(88, 72 + insets.bottom) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showUploadPlaceholder ? (
            <Pressable
              onPress={() => setImagePickerOpen(true)}
              disabled={uploading}
              style={[styles.uploadPlaceholder, uploading && styles.uploadPlaceholderDisabled]}
            >
              <PopImage uri={DefaultImageIcon} style={{ width: 148, height: 88, opacity: 0.35 }} />
              <Text style={styles.uploadPlaceholderText}>
                {uploading
                  ? t('character.createPage.imageUploading')
                  : t('character.creation.uploadImage')}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.imageGridCard}>
              <View style={styles.imageGrid}>
                {imageUrls.map((url, index) => (
                  <View key={`${url}-${index}`} style={styles.imageWrapper}>
                    <PopImage
                      uri={url.startsWith('file:') ? url : resolveTosAssetUrl(url)}
                      style={styles.image}
                      contentFit="cover"
                    />
                    <Pressable
                      onPress={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
                      style={styles.imageDeleteButton}
                      accessibilityLabel={t('character.createPage.imageDelete')}
                    >
                      <Text style={styles.imageDeleteText}>×</Text>
                    </Pressable>
                  </View>
                ))}
                {imageUrls.length < MAX_DYNAMIC_IMAGES && (
                  <Pressable
                    onPress={() => setImagePickerOpen(true)}
                    disabled={uploading}
                    style={styles.imageAddButton}
                    accessibilityLabel={t('character.createPage.imageAdd')}
                  >
                    <Text style={styles.imageAddText}>+</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          <View style={styles.textCard}>
            <TextInput
              value={text}
              onChangeText={(v) => setText(v.slice(0, MAX_TEXT_LENGTH))}
              placeholder={t('character.creation.dynamicDescriptionPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.25)"
              multiline
              style={styles.textInput}
            />
          </View>

          <Pressable onPress={() => setMusicPickerOpen(true)} style={styles.musicRow}>
            <View style={styles.musicRowLeft}>
              <Text style={styles.musicEmoji} accessibilityElementsHidden>
                🎵
              </Text>
              <Text
                style={[styles.musicValue, !musicKey && styles.musicValuePlaceholder]}
                numberOfLines={1}
              >
                {musicKey ? musicTitle || musicKey : t('character.creation.selectMusic')}
              </Text>
            </View>
            <Image source={{ uri: addCharacterCreateAssets.rightGreyArrow }} style={[{width: 12, height: 12}, styles.musicArrow]} />
          </Pressable>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <Pressable
            disabled={!canPublish || publishing}
            onPress={() => void handlePublish()}
            style={[styles.publishButton, (!canPublish || publishing) && styles.publishButtonDisabled]}
          >
            {publishing ? (
              <View style={styles.publishButtonInner}>
                <SpinnerIcon size={20} color="#ffffff" />
                <Text style={styles.publishButtonText}>{t('character.creation.publishing')}</Text>
              </View>
            ) : (
              <Text style={styles.publishButtonText}>{t('character.creation.publish')}</Text>
            )}
          </Pressable>
        </View>

        {publishing && (
          <View style={styles.publishingOverlay} accessibilityLiveRegion="polite">
            <View style={styles.publishingIndicator}>
              <SpinnerIcon size={32} color="#ffffff" />
            </View>
          </View>
        )}
      </FullscreenPage>

      <MusicPickerSheet
        open={musicPickerOpen}
        value={musicKey}
        onClose={() => setMusicPickerOpen(false)}
        onSelect={(music) => {
          setMusicKey(music.music_key)
          setMusicTitle(music.title?.trim() || music.music_key)
        }}
        onClear={() => {
          setMusicKey(null)
          setMusicTitle('')
        }}
      />

      <PostDynamicImagePickerSheet
        open={imagePickerOpen}
        maxSelectable={galleryMaxSelectable}
        onClose={() => setImagePickerOpen(false)}
        onAiSelect={() => setAiFlowOpen(true)}
        onGallerySelect={() => setGalleryPickerOpen(true)}
        onConfirm={handleDeviceAlbumConfirm}
        confirming={uploading}
      />

      <CharacterGalleryPickerSheet
        open={galleryPickerOpen}
        characterId={characterId}
        maxSelectable={galleryMaxSelectable}
        onClose={() => setGalleryPickerOpen(false)}
        onConfirm={appendImages}
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
  closeButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    zIndex: 1,
  },
  closeButtonDisabled: {
    opacity: 0.4,
  },
  headerCenter: {
    maxWidth: '60%',
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
  uploadPlaceholderDisabled: {
    opacity: 0.6,
  },
  uploadPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  imageGridCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  },
  textInput: {
    minHeight: 100,
    fontSize: 14,
    color: '#000000',
    textAlignVertical: 'top',
    padding: 0,
  },
  musicRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  musicRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  musicEmoji: {
    fontSize: 20,
    lineHeight: 22,
  },
  musicValue: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  musicValuePlaceholder: {
    color: 'rgba(0,0,0,0.5)',
  },
  musicArrow: {
    opacity: 0.4,
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
  publishButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  publishingOverlay: {
    ...StyleSheet.absoluteFill,
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
