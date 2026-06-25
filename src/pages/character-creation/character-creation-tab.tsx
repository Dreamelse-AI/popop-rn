import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/app/navigation';
import { LOGO_POPOP_PNG } from '@/shared/assets/feed';
import { useCreationCharacters } from '@/features/character-creation/hooks/use-creation-characters';
import type { CreationCharacterItem, CreationListTab } from '@/features/character-creation/types';

import { CreationCharacterCard } from './components/creation-character-card';
import { CreationDeleteConfirmDialog } from './components/creation-delete-confirm-dialog';
import { CreationEmptyState } from './components/creation-empty-state';
import { CreationNewCard } from './components/creation-new-card';
import { CreationPostDynamicSheet } from './components/creation-post-dynamic-sheet';
import { CreationTopTabs } from './components/creation-top-tabs';

const LogoPopop = LOGO_POPOP_PNG;

type CharacterCreationTabProps = {
  isActive?: boolean;
  onNavigateToFeed?: () => void;
};

export function CharacterCreationTab({ isActive = true, onNavigateToFeed }: CharacterCreationTabProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CreationListTab>('draft');
  const [deleteTarget, setDeleteTarget] = useState<CreationCharacterItem | null>(null);
  const [dynamicTarget, setDynamicTarget] = useState<CreationCharacterItem | null>(null);

  const {
    drafts,
    published,
    loading,
    error,
    deletingId,
    isPublishing,
    getPublishError,
    refresh,
    deleteItem,
    publishDraft,
  } = useCreationCharacters(isActive);

  const isGloballyEmpty = !loading && !error && drafts.length === 0 && published.length === 0;

  const handleCreate = useCallback(() => {
    navigation.navigate('CharacterCreate');
  }, [navigation]);

  const handleEdit = useCallback(
    (item: CreationCharacterItem) => {
      if (item.status === 'draft') {
        navigation.navigate('CharacterCreate', { draftId: item.id });
        return;
      }
      navigation.navigate('CharacterCreate', { characterId: item.id, mode: 'character' });
    },
    [navigation],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteItem(deleteTarget);
    setDeleteTarget(null);
  }, [deleteItem, deleteTarget]);

  const handlePostPublishSuccess = useCallback(() => {
    setDynamicTarget(null);
    onNavigateToFeed?.();
  }, [onNavigateToFeed]);

  const currentItems = activeTab === 'draft' ? drafts : published;

  return (
    <View style={styles.container}>
      <View style={styles.logoBar}>
        <Image source={{ uri: LogoPopop }} style={{width: 190, height: 30}} />
      </View>

      {isGloballyEmpty ? (
        <CreationEmptyState onCreate={handleCreate} creating={false} />
      ) : (
        <>
          <CreationTopTabs activeTab={activeTab} onChange={setActiveTab} />

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading && currentItems.length === 0 ? (
              <View style={styles.skeletonList}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <View key={index} style={styles.skeletonCard} />
                ))}
              </View>
            ) : error && currentItems.length === 0 ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('character.creation.loadFailed')}</Text>
                <Pressable
                  onPress={() => void refresh()}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>{t('character.creation.retry')}</Text>
                </Pressable>
              </View>
            ) : activeTab === 'draft' ? (
              <View style={styles.cardList}>
                <CreationNewCard onClick={handleCreate} disabled={false} />
                {drafts.map((item) => (
                  <CreationCharacterCard
                    key={item.id}
                    item={item}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => setDeleteTarget(item)}
                    onPublish={() => void publishDraft(item.id)}
                    publishing={isPublishing(item.id)}
                    deleting={deletingId === item.id}
                    rejected={item.draftAuditStatus === 'rejected'}
                    rejectReason={getPublishError(item.id)}
                  />
                ))}
              </View>
            ) : published.length === 0 ? (
              <View style={styles.emptyPublished}>
                <Text style={styles.emptyPublishedText}>{t('character.creation.noPublished')}</Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {published.map((item) => (
                  <CreationCharacterCard
                    key={item.id}
                    item={item}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => setDeleteTarget(item)}
                    onPostDynamic={() => setDynamicTarget(item)}
                    deleting={deletingId === item.id}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}

      <CreationDeleteConfirmDialog
        open={deleteTarget !== null}
        loading={deletingId !== null}
        onClose={() => {
          if (deletingId) return;
          setDeleteTarget(null);
        }}
        onConfirm={() => void handleDeleteConfirm()}
      />

      <CreationPostDynamicSheet
        open={dynamicTarget !== null}
        characterId={dynamicTarget?.id ?? ''}
        characterName={dynamicTarget?.name.trim() || t('character.creation.unnamed')}
        characterCoverUrl={dynamicTarget?.coverUrl}
        onClose={() => setDynamicTarget(null)}
        onPublishSuccess={handlePostPublishSuccess}
        includeSafeAreaTop={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
    backgroundColor: '#f7f7f7',
  },
  logoBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  skeletonList: {
    flexDirection: 'column',
    gap: 12,
  },
  skeletonCard: {
    width: '100%',
    aspectRatio: 358 / 268,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 64,
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
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  cardList: {
    flexDirection: 'column',
    gap: 12,
  },
  emptyPublished: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyPublishedText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
});
