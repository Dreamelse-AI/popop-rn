import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';

import { fetchAppearanceStyles } from '@/features/character-creation/api/appearance-styles-api';
import type { AppearanceStyleItem } from '@/features/character-creation/api/appearance-styles-api';
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { SheetBody, SheetFooterButton, SheetHeader, SheetLoading } from '@/shared/ui/sheet-primitives';

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
      header={<SheetHeader title={t('character.createPage.imageAiStyleTitle')} />}
      footer={
        <SheetFooterButton
          label={t('character.createPage.imageAiStyleConfirm')}
          onPress={handleConfirm}
          disabled={!draftStyleKey || loading}
        />
      }
    >
      <SheetBody style={styles.content}>
        {loading && styles2.length === 0 ? (
          <SheetLoading message={t('character.creation.loading')} />
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
      </SheetBody>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 4,
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
});
