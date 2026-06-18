import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import type { CreationCharacterItem } from '@/features/character-creation/types';
import { characterAssets } from '@/shared/assets/character';
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload';
import { PopImage } from '@/shared/ui/pop-image';

import { IconLightning, IconPencil, IconPublish, IconTrash, SpinnerIcon } from './creation-icons';

/** 358×268 卡片内图案尺寸/偏移（对齐 PC EmptyCoverPattern） */
const DRAFT_EMPTY_PATTERN = {
  widthRatio: 1728 / 358,
  heightRatio: 1037 / 268,
  leftRatio: -19 / 358,
  topRatio: -99 / 268,
} as const;

function DraftEmptyCoverBackground() {
  return (
    <View style={styles.draftEmptyBg}>
      <PopImage
        uri={characterAssets.creationDraftCardEmptyPattern.uri}
        style={styles.draftEmptyPattern}
        contentFit="cover"
        accessibilityLabel=""
      />
    </View>
  );
}

type CreationCharacterCardProps = {
  item: CreationCharacterItem;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onPostDynamic?: () => void;
  publishing?: boolean;
  deleting?: boolean;
};

function DraftCharacterCard({
  displayName,
  onEdit,
  onDelete,
  onPublish,
  publishing,
  deleting,
}: {
  displayName: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
  deleting?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <View style={draftStyles.container}>
      <View style={draftStyles.topRow}>
        <Pressable onPress={onEdit} style={draftStyles.nameButton}>
          <Text style={draftStyles.nameText} numberOfLines={1}>{displayName}</Text>
          <IconPencil size={14} color="rgba(255,255,255,0.9)" />
        </Pressable>

        <Pressable
          onPress={onDelete}
          disabled={deleting}
          style={[draftStyles.deleteButton, deleting ? draftStyles.deleteButtonDisabled : undefined]}
          accessibilityLabel={t('character.creation.delete')}
        >
          <IconTrash size={16} color="#ffffff" />
        </Pressable>
      </View>

      <View style={draftStyles.bottomRow}>
        <Pressable
          onPress={onPublish}
          disabled={publishing}
          style={[
            draftStyles.publishButton,
            publishing ? draftStyles.publishButtonPublishing : undefined,
            publishing ? draftStyles.publishButtonDisabled : undefined,
          ]}
        >
          {publishing ? (
            <SpinnerIcon size={14} color="rgba(0,0,0,0.7)" />
          ) : (
            <IconPublish size={14} color="#000000" />
          )}
          <Text style={[draftStyles.publishText, publishing ? draftStyles.publishTextPublishing : undefined]}>
            {publishing ? t('character.creation.publishing') : t('character.creation.publish')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PublishedCharacterCard({
  displayName,
  onEdit,
  onDelete,
  onPostDynamic,
  deleting,
}: {
  displayName: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPostDynamic?: () => void;
  deleting?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      <View style={publishedStyles.topRow}>
        <Text style={publishedStyles.nameText} numberOfLines={1}>{displayName}</Text>
        <Pressable
          onPress={onDelete}
          disabled={deleting}
          style={[publishedStyles.deleteButton, deleting ? publishedStyles.deleteButtonDisabled : undefined]}
          accessibilityLabel={t('character.creation.delete')}
        >
          <IconTrash size={16} color="#ffffff" />
        </Pressable>
      </View>

      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.35)', 'transparent']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={publishedStyles.gradient}
        pointerEvents="none"
      />

      <View style={publishedStyles.bottomRow}>
        <Pressable onPress={onEdit} style={publishedStyles.actionButton}>
          <IconPencil size={14} color="#ffffff" />
          <Text style={publishedStyles.actionText}>{t('character.creation.edit')}</Text>
        </Pressable>
        <View style={publishedStyles.divider} />
        <Pressable onPress={onPostDynamic} style={publishedStyles.actionButton}>
          <IconLightning size={14} color="#ffffff" />
          <Text style={publishedStyles.actionText}>{t('character.creation.dynamic')}</Text>
        </Pressable>
      </View>
    </>
  );
}

export function CreationCharacterCard({
  item,
  onEdit,
  onDelete,
  onPublish,
  onPostDynamic,
  publishing = false,
  deleting = false,
}: CreationCharacterCardProps) {
  const { t } = useTranslation();
  const displayName = item.name.trim() || t('character.creation.unnamed');
  const isPublished = item.status === 'published';
  const hasCover = Boolean(item.coverUrl);

  return (
    <View style={styles.card}>
      {hasCover ? (
        <Image
          source={{ uri: resolveTosAssetUrl(item.coverUrl!) }}
          style={styles.coverImage}
          contentFit="cover"
        />
      ) : isPublished ? (
        <LinearGradient
          colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.08)']}
          style={styles.publishedEmptyBg}
        />
      ) : (
        <DraftEmptyCoverBackground />
      )}

      {hasCover && (
        <LinearGradient
          colors={
            isPublished
              ? ['rgba(0,0,0,0.3)', 'transparent', 'transparent']
              : ['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.35)']
          }
          locations={[0, 0.5, 1]}
          style={styles.coverOverlay}
          pointerEvents="none"
        />
      )}

      {isPublished ? (
        <PublishedCharacterCard
          displayName={displayName}
          onEdit={onEdit}
          onDelete={onDelete}
          onPostDynamic={onPostDynamic}
          deleting={deleting}
        />
      ) : (
        <DraftCharacterCard
          displayName={displayName}
          onEdit={onEdit}
          onDelete={onDelete}
          onPublish={onPublish}
          publishing={publishing}
          deleting={deleting}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    width: '100%',
    aspectRatio: 358 / 268,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  publishedEmptyBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  draftEmptyBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  draftEmptyPattern: {
    position: 'absolute',
    width: `${DRAFT_EMPTY_PATTERN.widthRatio * 100}%`,
    height: `${DRAFT_EMPTY_PATTERN.heightRatio * 100}%`,
    left: `${DRAFT_EMPTY_PATTERN.leftRatio * 100}%`,
    top: `${DRAFT_EMPTY_PATTERN.topRatio * 100}%`,
    opacity: 0.04,
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});

const draftStyles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    flexDirection: 'column',
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '70%',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    flexShrink: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  bottomRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  publishButtonPublishing: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  publishTextPublishing: {
    color: 'rgba(0,0,0,0.7)',
  },
});

const publishedStyles = StyleSheet.create({
  topRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
  },
  nameText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    zIndex: 2,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  divider: {
    width: 1,
    marginVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
