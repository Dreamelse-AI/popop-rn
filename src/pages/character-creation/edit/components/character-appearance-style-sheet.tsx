import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';

import { fetchAppearanceStyles } from '@/features/character-creation/api/appearance-styles-api';
import type { AppearanceStyleItem } from '@/features/character-creation/api/appearance-styles-api';
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

type CharacterAppearanceStyleSheetProps = {
  open: boolean;
  selectedStyleKey: string;
  onClose: () => void;
  onConfirm: (styleKey: string) => void;
};

export function CharacterAppearanceStyleSheet({
  open,
  selectedStyleKey,
  onClose,
  onConfirm,
}: CharacterAppearanceStyleSheetProps) {
  const { t } = useTranslation();
  const [styles2, setStyles2] = useState<AppearanceStyleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [draftStyleKey, setDraftStyleKey] = useState(selectedStyleKey);

  useEffect(() => {
    if (!open) return;
    setDraftStyleKey(selectedStyleKey);
    setLoading(true);
    void fetchAppearanceStyles()
      .then((items) => {
        setStyles2(items);
        if (!selectedStyleKey && items[0]?.style_key) {
          setDraftStyleKey(items[0].style_key);
        }
      })
      .finally(() => setLoading(false));
  }, [open, selectedStyleKey]);

  const handleConfirm = () => {
    if (!draftStyleKey) return;
    onConfirm(draftStyleKey);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            {t('character.createPage.imageAiStyleTitle')}
          </Text>
        </View>
      }
      footer={
        <Pressable
          disabled={!draftStyleKey || loading}
          onPress={handleConfirm}
          style={[styles.confirmButton, (!draftStyleKey || loading) ? styles.confirmButtonDisabled : undefined]}
        >
          <Text style={styles.confirmButtonText}>
            {t('character.createPage.imageAiStyleConfirm')}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        {loading && styles2.length === 0 ? (
          <Text style={styles.loadingText}>
            {t('character.creation.loading')}
          </Text>
        ) : (
          <View style={styles.grid}>
            {styles2.map((style) => {
              const selected = draftStyleKey === style.style_key;
              return (
                <Pressable
                  key={style.style_key}
                  onPress={() => setDraftStyleKey(style.style_key)}
                  style={[
                    styles.gridItem,
                    selected ? styles.gridItemSelected : styles.gridItemDefault,
                  ]}
                >
                  {style.style_icon?.url && (
                    <Image
                      source={{ uri: resolveTosAssetUrl(style.style_icon.url) }}
                      style={styles.gridImage}
                      contentFit="cover"
                    />
                  )}
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {style.style_name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 21,
    color: '#000000',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingText: {
    paddingVertical: 40,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '31%',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 4,
    overflow: 'hidden',
  },
  gridItemSelected: {
    borderWidth: 3,
    borderColor: '#000000',
  },
  gridItemDefault: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  gridLabel: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  confirmButton: {
    height: 60,
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#ffffff',
  },
});
