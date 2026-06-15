import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { persistAppearanceImages } from '@/features/character-creation/api/appearance-image-api';
import {
  appendAppearanceImageTag,
  normalizeAppearanceImageTag,
  replaceAppearanceImageTag,
} from '@/features/character-creation/lib/appearance-image-tags';
import type { CreationFormImage } from '@/features/character-creation/types/form';
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload';

type CharacterAppearanceImageViewerProps = {
  open: boolean;
  imageId: string | null;
  images: CreationFormImage[];
  draftId?: string;
  onClose: () => void;
  onChange: (images: CreationFormImage[]) => void;
  onDuplicateTag?: () => void;
};

function syncImages(
  images: CreationFormImage[],
  imageId: string,
  patch: Partial<CreationFormImage>,
): CreationFormImage[] {
  return images.map((img) => (img.id === imageId ? { ...img, ...patch } : img));
}

export function CharacterAppearanceImageViewer({
  open,
  imageId,
  images,
  draftId,
  onClose,
  onChange,
  onDuplicateTag,
}: CharacterAppearanceImageViewerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const image = imageId ? images.find((item) => item.id === imageId) : null;

  useEffect(() => {
    if (!open) {
      setNewTagInput('');
      setEditingTagIndex(null);
      setEditingTagValue('');
    }
  }, [open, imageId]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  const schedulePersist = useCallback(
    (nextImages: CreationFormImage[]) => {
      if (!draftId) return;
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(() => {
        void persistAppearanceImages(draftId, nextImages).catch((error) => {
          console.error('[CharacterAppearanceImageViewer] persist failed:', error);
        });
      }, 500);
    },
    [draftId],
  );

  const commitImages = useCallback(
    (nextImages: CreationFormImage[]) => {
      onChange(nextImages);
      schedulePersist(nextImages);
    },
    [onChange, schedulePersist],
  );

  const handleSetMain = () => {
    if (!image || image.isMain) return;
    const nextImages = images.map((item) => ({
      ...item,
      isMain: item.id === image.id,
    }));
    commitImages(nextImages);
  };

  const handleRemoveTag = (index: number) => {
    if (!image) return;
    const nextTags = image.tags.filter((_, itemIndex) => itemIndex !== index);
    commitImages(syncImages(images, image.id, { tags: nextTags }));
    if (editingTagIndex === index) {
      setEditingTagIndex(null);
      setEditingTagValue('');
    }
  };

  const handleAddTag = () => {
    if (!image) return;
    const nextTags = appendAppearanceImageTag(image.tags, newTagInput);
    if (!nextTags) {
      if (normalizeAppearanceImageTag(newTagInput)) {
        onDuplicateTag?.();
      }
      return;
    }
    commitImages(syncImages(images, image.id, { tags: nextTags }));
    setNewTagInput('');
  };

  const commitTagEdit = () => {
    if (!image || editingTagIndex === null) return;

    const nextTags = replaceAppearanceImageTag(image.tags, editingTagIndex, editingTagValue);
    if (!nextTags) {
      if (normalizeAppearanceImageTag(editingTagValue)) {
        onDuplicateTag?.();
      }
      setEditingTagIndex(null);
      setEditingTagValue('');
      return;
    }

    commitImages(syncImages(images, image.id, { tags: nextTags }));
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  if (!open || !image) return null;

  const imageUrl = resolveTosAssetUrl(image.url);

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel={t('character.detailPage.back')}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>

          <Pressable
            onPress={handleSetMain}
            disabled={image.isMain}
            style={[
              styles.setMainButton,
              image.isMain ? styles.setMainButtonDisabled : styles.setMainButtonEnabled,
            ]}
          >
            <Text
              style={[
                styles.setMainButtonText,
                image.isMain ? styles.setMainTextDisabled : styles.setMainTextEnabled,
              ]}
            >
              {t('character.createPage.imageSetMain')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.imageArea}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="contain"
            />
            {image.isMain && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>
                  {t('character.createPage.imageDefaultBadge')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.bottomArea, { paddingBottom: Math.max(12, insets.bottom) }]}>
          {image.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagList}
              style={styles.tagScrollView}
            >
              {image.tags.map((tag, index) => (
                <View key={`${tag}-${index}`} style={styles.tagChip}>
                  {editingTagIndex === index ? (
                    <TextInput
                      value={editingTagValue}
                      onChangeText={setEditingTagValue}
                      onBlur={commitTagEdit}
                      onSubmitEditing={commitTagEdit}
                      autoFocus
                      style={styles.tagEditInput}
                    />
                  ) : (
                    <Pressable
                      onPress={() => {
                        setEditingTagIndex(index);
                        setEditingTagValue(tag);
                      }}
                    >
                      <Text style={styles.tagText}>{tag}</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleRemoveTag(index)}
                    style={styles.tagRemoveButton}
                    accessibilityLabel={t('character.createPage.imageTagRemove')}
                  >
                    <Text style={styles.tagRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.tagInputRow}>
            <TextInput
              value={newTagInput}
              onChangeText={setNewTagInput}
              onSubmitEditing={handleAddTag}
              placeholder={t('character.createPage.imageTagAddPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.35)"
              returnKeyType="done"
              style={styles.tagInput}
            />
            <Pressable
              onPress={handleAddTag}
              style={styles.tagAddButton}
              accessibilityLabel={t('character.createPage.imageTagAdd')}
            >
              <Text style={styles.tagAddButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
  },
  setMainButton: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  setMainButtonEnabled: {
    backgroundColor: '#ffffff',
  },
  setMainButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  setMainButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  setMainTextEnabled: {
    color: '#000000',
  },
  setMainTextDisabled: {
    color: 'rgba(255,255,255,0.35)',
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 340,
    aspectRatio: 3 / 4,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  mainBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  bottomArea: {
    paddingHorizontal: 16,
  },
  tagScrollView: {
    marginBottom: 12,
  },
  tagList: {
    flexDirection: 'row',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
  },
  tagEditInput: {
    minWidth: 48,
    maxWidth: 128,
    fontSize: 14,
    color: '#ffffff',
  },
  tagText: {
    fontSize: 14,
    color: '#ffffff',
  },
  tagRemoveButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRemoveText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tagInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: '#ffffff',
  },
  tagAddButton: {
    marginLeft: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagAddButtonText: {
    fontSize: 20,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.7)',
  },
});
