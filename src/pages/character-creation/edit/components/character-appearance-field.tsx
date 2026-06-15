import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { MAX_CHARACTER_IMAGES } from '@/features/character-creation/config';
import type { GenerateAppearanceContext } from '@/features/character-creation/api/gen-appearance-api';
import { CharacterAiImageFlow } from '@/features/character-creation/ui/character-ai-image-flow';
import { uploadCharacterAppearanceImage } from '@/features/character-creation/lib/upload-character-image';
import type { CreationFormImage } from '@/features/character-creation/types/form';
import { randomUUID } from '@/shared/lib/random-uuid';
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload';
import { CharacterAppearanceImageViewer } from './character-appearance-image-viewer';
import { CharacterImageGallerySheet } from './character-image-gallery-sheet';
import {
  CharacterImageSourcePopover,
  type ImageSourceMenuAnchor,
} from './character-image-source-popover';

type CharacterAppearanceFieldProps = {
  images: CreationFormImage[];
  draftId?: string;
  getGenerationContext: () => GenerateAppearanceContext;
  onChange: (images: CreationFormImage[]) => void;
  onGalleryTriggerReady?: (openGallery: () => void) => void;
};

export function CharacterAppearanceField({
  images,
  draftId,
  getGenerationContext,
  onChange,
  onGalleryTriggerReady,
}: CharacterAppearanceFieldProps) {
  const { t } = useTranslation();
  const [sourceMenuVisible, setSourceMenuVisible] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [aiFlowOpen, setAiFlowOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canAddMore = images.length < MAX_CHARACTER_IMAGES;
  const hasImages = images.length > 0;

  const openGallery = useCallback(() => {
    setGalleryOpen(true);
  }, []);

  useEffect(() => {
    onGalleryTriggerReady?.(openGallery);
  }, [onGalleryTriggerReady, openGallery]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const openSourceMenu = useCallback(() => {
    if (!canAddMore) {
      showToast(t('character.createPage.imageAiResultLimitReached'));
      return;
    }
    setSourceMenuVisible(true);
  }, [canAddMore, showToast, t]);

  const handleLocalUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) return;

    const remaining = MAX_CHARACTER_IMAGES - images.length;
    if (remaining <= 0) return;

    const picked = result.assets.slice(0, remaining);
    setUploading(true);

    try {
      const uploaded: CreationFormImage[] = [];
      for (const asset of picked) {
        const url = await uploadCharacterAppearanceImage(asset.uri);
        uploaded.push({
          id: randomUUID(),
          url,
          source: 'upload',
          isMain: false,
          tags: [],
        });
      }

      const nextImages = [...images, ...uploaded];
      if (!nextImages.some((img) => img.isMain)) {
        nextImages[0] = { ...nextImages[0]!, isMain: true };
      }
      onChange(nextImages);
    } catch {
      showToast(t('character.createPage.imageUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleAiGenerateOpen = () => {
    setAiFlowOpen(true);
  };

  const handleAiConfirm = (imageUrl: string) => {
    const remaining = MAX_CHARACTER_IMAGES - images.length;
    if (remaining <= 0) {
      showToast(t('character.createPage.imageAiResultLimitReached'));
      return;
    }

    const newImage: CreationFormImage = {
      id: randomUUID(),
      url: imageUrl,
      source: 'aigc',
      isMain: images.length === 0,
      tags: [],
    };

    const nextImages = [...images, newImage];
    if (!nextImages.some((img) => img.isMain)) {
      nextImages[0] = { ...nextImages[0]!, isMain: true };
    }

    onChange(nextImages);
    setAiFlowOpen(false);
  };

  const dummyAnchor: ImageSourceMenuAnchor = { x: 0, y: 0, width: 0, height: 0 };

  return (
    <>
      {!hasImages ? (
        <Pressable
          onPress={openSourceMenu}
          disabled={uploading}
          style={[styles.emptyButton, uploading ? styles.emptyButtonDisabled : undefined]}
        >
          <Text style={styles.emptyPlaceholder}>
            {t('character.createPage.imageAdd')}
          </Text>
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <Text style={styles.uploadingText}>
                {t('character.createPage.imageUploading')}
              </Text>
            </View>
          )}
        </Pressable>
      ) : (
        <View style={styles.grid}>
          <Pressable
            onPress={openSourceMenu}
            disabled={uploading}
            style={[
              styles.addCell,
              uploading ? styles.addCellDisabled : undefined,
            ]}
            accessibilityLabel={t('character.createPage.imageAdd')}
          >
            <Text
              style={[
                styles.addCellText,
                canAddMore ? styles.addCellTextActive : styles.addCellTextInactive,
              ]}
            >
              +
            </Text>
          </Pressable>
          {images.map((img) => (
            <Pressable
              key={img.id}
              onPress={() => setPreviewImageId(img.id)}
              style={styles.imageCell}
            >
              <Image
                source={{ uri: resolveTosAssetUrl(img.url) }}
                style={styles.imageCellImage}
                contentFit="cover"
              />
              {img.isMain && (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>
                    {t('character.createPage.imageDefaultBadge')}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {sourceMenuVisible && (
        <CharacterImageSourcePopover
          anchor={dummyAnchor}
          onClose={() => setSourceMenuVisible(false)}
          onLocalUpload={() => void handleLocalUpload()}
          onAiGenerate={handleAiGenerateOpen}
        />
      )}

      <CharacterImageGallerySheet
        open={galleryOpen}
        images={images}
        onClose={() => setGalleryOpen(false)}
        onChange={onChange}
        onAdd={openSourceMenu}
        canAddMore={canAddMore}
      />

      <CharacterAiImageFlow
        open={aiFlowOpen}
        onClose={() => setAiFlowOpen(false)}
        onConfirm={handleAiConfirm}
        getGenerationContext={getGenerationContext}
      />

      <CharacterAppearanceImageViewer
        open={previewImageId !== null}
        imageId={previewImageId}
        images={images}
        draftId={draftId}
        onClose={() => setPreviewImageId(null)}
        onChange={onChange}
        onDuplicateTag={() => showToast(t('character.createPage.imageTagDuplicate'))}
      />

      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  emptyButton: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 20,
    backgroundColor: '#efefef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonDisabled: {
    opacity: 0.7,
  },
  emptyPlaceholder: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.35)',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#efefef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCellDisabled: {
    opacity: 0.5,
  },
  addCellText: {
    fontSize: 28,
  },
  addCellTextActive: {
    color: 'rgba(0,0,0,0.25)',
  },
  addCellTextInactive: {
    color: 'rgba(0,0,0,0.15)',
  },
  imageCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#efefef',
    overflow: 'hidden',
  },
  imageCellImage: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    right: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 14,
    color: '#ffffff',
  },
});
