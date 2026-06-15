import { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FullscreenPage, PageHeaderBar, BackButton } from '@/shared/ui/fullscreen-page';

type CreationPostDynamicSheetProps = {
  open: boolean;
  characterId: string;
  characterName: string;
  characterCoverUrl?: string | null;
  onClose: () => void;
  onPublishSuccess?: () => void;
};

export function CreationPostDynamicSheet({
  open,
  characterId: _characterId,
  characterName,
  characterCoverUrl: _characterCoverUrl,
  onClose,
  onPublishSuccess: _onPublishSuccess,
}: CreationPostDynamicSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  if (!open) return null;

  return (
    <FullscreenPage backgroundColor="#f7f7f7">
      <PageHeaderBar>
        <BackButton onPress={onClose} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {characterName}
        </Text>
      </PageHeaderBar>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(24, insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.entrySection}>
          <Pressable style={styles.entryButton}>
            <Text style={styles.entryButtonText}>
              {t('character.creation.dynamic')}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>
          {t('character.creation.dynamicHistory')}
        </Text>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('character.creation.noDynamics')}</Text>
        </View>
      </ScrollView>
    </FullscreenPage>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    maxWidth: '60%',
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'column',
  },
  entrySection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  entryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  entryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  sectionLabel: {
    paddingBottom: 8,
    paddingLeft: 20,
    paddingTop: 24,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
});
