import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import type { CreationFormImage } from '@/features/character-creation/types/form';
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload';
import { FullscreenPage, PageHeaderBar, BackButton } from '@/shared/ui/fullscreen-page';

type CharacterImageGallerySheetProps = {
  open: boolean;
  images: CreationFormImage[];
  onClose: () => void;
  onChange: (images: CreationFormImage[]) => void;
  onAdd: () => void;
  canAddMore?: boolean;
};

type MenuState = {
  imageId: string;
} | null;

export function CharacterImageGallerySheet({
  open,
  images,
  onClose,
  onChange,
  onAdd,
  canAddMore = true,
}: CharacterImageGallerySheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState<MenuState>(null);

  if (!open) return null;

  const handleSetMain = (imageId: string) => {
    onChange(images.map((img) => ({ ...img, isMain: img.id === imageId })));
    setMenu(null);
  };

  const handleDelete = (imageId: string) => {
    const next = images.filter((img) => img.id !== imageId);
    if (next.length > 0 && !next.some((img) => img.isMain)) {
      next[0] = { ...next[0]!, isMain: true };
    }
    onChange(next);
    setMenu(null);
  };

  return (
    <FullscreenPage backgroundColor="#f7f7f7">
      <PageHeaderBar>
        <BackButton onPress={onClose} />
        <Text style={styles.headerTitle}>
          {t('character.createPage.appearanceTitle')}
        </Text>
        <Text style={styles.headerManage}>
          {t('character.createPage.imageGalleryManage')}
        </Text>
      </PageHeaderBar>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(96, 80 + insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {images.map((img) => (
            <Pressable
              key={img.id}
              onPress={() => setMenu({ imageId: img.id })}
              style={styles.gridItem}
            >
              <Image
                source={{ uri: resolveTosAssetUrl(img.url) }}
                style={styles.gridImage}
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
      </ScrollView>

      <Pressable
        onPress={onAdd}
        style={[
          styles.addFab,
          { bottom: Math.max(24, insets.bottom) },
          !canAddMore ? styles.addFabDisabled : undefined,
        ]}
        accessibilityLabel={t('character.createPage.imageAdd')}
      >
        <Text style={styles.addFabText}>+</Text>
      </Pressable>

      {menu && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setMenu(null)}
        >
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenu(null)}
            accessibilityLabel={t('character.detailPage.back')}
          />
          <View style={styles.menuOverlay}>
            <View style={styles.menuPanel}>
              <Pressable
                onPress={() => handleSetMain(menu.imageId)}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemEmoji}>👤</Text>
                <Text style={styles.menuItemText}>
                  {t('character.createPage.imageSetMain')}
                </Text>
              </Pressable>
              <View style={styles.menuSeparator} />
              <Pressable
                onPress={() => handleDelete(menu.imageId)}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemEmoji}>🗑</Text>
                <Text style={styles.menuItemTextDanger}>
                  {t('character.createPage.imageDelete')}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </FullscreenPage>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  headerManage: {
    position: 'absolute',
    right: 16,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridItem: {
    width: '33%',
    aspectRatio: 3 / 4,
    backgroundColor: '#efefef',
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  addFab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addFabDisabled: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  addFabText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#ffffff',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  menuPanel: {
    minWidth: 180,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemEmoji: {
    fontSize: 16,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  menuItemTextDanger: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
