import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { Image } from 'expo-image'

import {
  resolveDevicePhotoUri,
  useDevicePhotoAlbum,
  hasPhotoAccess,
  type DevicePhotoAsset,
} from '@/features/post-dynamic/lib/use-device-photo-album'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import {
  SheetEmpty,
  SheetFooterButton,
  SheetHeader,
  SheetLoading,
  SheetRetry,
} from '@/shared/ui/sheet-primitives'
import { SHEET } from '@/shared/ui/sheet-tokens'

import { IconGalleryStack, IconSparkles } from './post-dynamic-icons'

const GRID_COLUMNS = 3
const GRID_GAP = 4

type PostDynamicImagePickerSheetProps = {
  open: boolean
  maxSelectable: number
  onClose: () => void
  onAiSelect: () => void
  /** 从角色图库（character detail outfits）选择 */
  onGallerySelect: () => void
  onConfirm: (uris: string[]) => void | Promise<void>
  confirming?: boolean
}

export function PostDynamicImagePickerSheet({
  open,
  maxSelectable,
  onClose,
  onAiSelect,
  onGallerySelect,
  onConfirm,
  confirming = false,
}: PostDynamicImagePickerSheetProps) {
  const { t } = useTranslation()
  const listRef = useRef<FlatList<DevicePhotoAsset>>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [albumMenuOpen, setAlbumMenuOpen] = useState(false)

  const {
    permission,
    albums,
    selectedAlbumId,
    setSelectedAlbumId,
    assets,
    loading,
    loadingMore,
    error,
    requestPermission,
    reload,
    loadMore,
    requestingPermission,
    needsSettings,
  } = useDevicePhotoAlbum({ enabled: open })

  const selectedCount = selectedIds.length
  const selectedAlbumTitle = useMemo(() => {
    if (!selectedAlbumId) return t('character.createPage.imagePickerRecentProjects')
    return albums.find((album) => album.id === selectedAlbumId)?.title
      ?? t('character.createPage.imagePickerRecentProjects')
  }, [albums, selectedAlbumId, t])

  useEffect(() => {
    if (!open) {
      setSelectedIds([])
      setAlbumMenuOpen(false)
    }
  }, [open])

  const toggleSelect = useCallback(
    (assetId: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(assetId)) {
          return prev.filter((id) => id !== assetId)
        }
        if (prev.length >= maxSelectable) return prev
        return [...prev, assetId]
      })
    },
    [maxSelectable],
  )

  const handleAiPress = () => {
    onAiSelect()
    onClose()
  }

  const handleGalleryPress = () => {
    onGallerySelect()
    onClose()
  }

  const handleRequestPermission = () => {
    void requestPermission()
  }

  const handleConfirm = async () => {
    if (!selectedIds.length || confirming) return
    const uris = await Promise.all(selectedIds.map((id) => resolveDevicePhotoUri(id)))
    await onConfirm(uris)
    onClose()
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const remaining = contentSize.height - layoutMeasurement.height - contentOffset.y
    if (remaining < 240) {
      loadMore()
    }
  }

  const renderPhoto = ({ item }: ListRenderItemInfo<DevicePhotoAsset>) => {
    const selected = selectedIds.includes(item.id)
    const disabled = !selected && selectedCount >= maxSelectable

    return (
      <Pressable
        disabled={disabled}
        onPress={() => toggleSelect(item.id)}
        style={[styles.photoCell, disabled && styles.photoCellDisabled]}
      >
        <Image source={{ uri: item.uri }} style={styles.photoImage} contentFit="cover" />
        <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
          {selected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </Pressable>
    )
  }

  const showConfirmFooter = selectedCount > 0

  const renderAlbumContent = () => {
    if (permission === null) {
      return <SheetLoading />
    }

    if (!hasPhotoAccess(permission)) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            {needsSettings
              ? t('character.createPage.imagePickerPermissionDenied')
              : t('character.createPage.imagePickerPermissionRequired')}
          </Text>
          <Pressable
            disabled={requestingPermission}
            onPress={handleRequestPermission}
            style={[styles.permissionButton, requestingPermission && styles.permissionButtonDisabled]}
          >
            {requestingPermission ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.permissionButtonText}>
                {needsSettings
                  ? t('character.createPage.imagePickerOpenSettings')
                  : t('character.createPage.imagePickerGrantPermission')}
              </Text>
            )}
          </Pressable>
        </View>
      )
    }

    if (loading) {
      return <SheetLoading />
    }

    if (error) {
      return (
        <SheetRetry
          message={t('character.createPage.imagePickerLoadFailed')}
          retryLabel={t('character.creation.retry')}
          onRetry={() => void reload()}
        />
      )
    }

    if (assets.length === 0) {
      return <SheetEmpty message={t('character.createPage.imagePickerEmpty')} />
    }

    return (
      <FlatList
        ref={listRef}
        style={styles.photoList}
        data={assets}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLUMNS}
        renderItem={renderPhoto}
        columnWrapperStyle={styles.photoRow}
        contentContainerStyle={styles.photoListContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color="#000000" />
            </View>
          ) : null
        }
      />
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      showHandle
      scrollable={false}
      header={
        <SheetHeader
          title={t('character.createPage.imagePickerAddTitle')}
          hint={t('character.createPage.imagePickerAddHint')}
          style={styles.header}
        />
      }
      footer={
        showConfirmFooter ? (
          <SheetFooterButton
            label={t('character.createPage.imagePickerConfirm', {
              count: selectedCount,
              max: maxSelectable,
            })}
            onPress={() => void handleConfirm()}
            disabled={confirming}
            loading={confirming}
          />
        ) : undefined
      }
    >
      <View style={styles.body}>
        <View style={styles.actionRow}>
          <Pressable onPress={handleAiPress} style={styles.actionButton}>
            <IconSparkles width={24} height={24} color="rgba(0,0,0,0.35)" />
            <Text style={styles.actionLabel}>{t('character.createPage.imageSourceAi')}</Text>
          </Pressable>
          <Pressable onPress={handleGalleryPress} style={styles.actionButton}>
            <IconGalleryStack width={24} height={24} color="rgba(0,0,0,0.35)" />
            <Text style={styles.actionLabel}>{t('character.createPage.imageSourceGallery')}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setAlbumMenuOpen((prev) => !prev)}
          style={styles.albumSelector}
          disabled={!hasPhotoAccess(permission) || albums.length === 0}
        >
          <Text style={styles.albumSelectorText} numberOfLines={1}>
            {selectedAlbumTitle}
          </Text>
          <Text style={styles.albumSelectorChevron}>▾</Text>
        </Pressable>

        {albumMenuOpen && albums.length > 0 ? (
          <View style={styles.albumMenu}>
            {albums.map((album) => (
              <Pressable
                key={album.id}
                onPress={() => {
                  setSelectedAlbumId(album.id)
                  setAlbumMenuOpen(false)
                }}
                style={[
                  styles.albumMenuItem,
                  album.id === selectedAlbumId && styles.albumMenuItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.albumMenuItemText,
                    album.id === selectedAlbumId && styles.albumMenuItemTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {album.title}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.listArea}>{renderAlbumContent()}</View>
      </View>
    </BottomSheet>
  )
}

const PHOTO_SIZE =
  (Dimensions.get('window').width - 16 * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS

const styles = StyleSheet.create({
  header: {
    paddingBottom: 0,
  },
  body: {
    flexShrink: 1,
    minHeight: 320,
  },
  listArea: {
    flex: 1,
    minHeight: 200,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.7)',
  },
  albumSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    maxWidth: '70%',
  },
  albumSelectorText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  albumSelectorChevron: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
  },
  albumMenu: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    maxHeight: 160,
  },
  albumMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  albumMenuItemActive: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  albumMenuItemText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
  },
  albumMenuItemTextActive: {
    fontWeight: '700',
    color: '#000000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  permissionText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  permissionButton: {
    borderRadius: 9999,
    backgroundColor: SHEET.retry.bg,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 140,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonDisabled: {
    opacity: 0.6,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: SHEET.retry.textColor,
  },
  photoList: {
    flex: 1,
  },
  photoListContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: GRID_GAP,
  },
  photoRow: {
    gap: GRID_GAP,
  },
  photoCell: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#efefef',
  },
  photoCellDisabled: {
    opacity: 0.4,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  checkCircle: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#fdeab3',
    borderColor: '#fdeab3',
  },
  checkMark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
})
