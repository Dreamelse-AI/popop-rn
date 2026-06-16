import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  ActivityIndicator,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'

import {
  resolveDevicePhotoUri,
  useDevicePhotoAlbum,
  hasPhotoAccess,
  type DevicePhotoAsset,
} from '@/features/post-dynamic/lib/use-device-photo-album'
import { SHEET } from '@/shared/ui/sheet-tokens'
import { SheetCloseIcon, SheetHeader } from '@/shared/ui/sheet-primitives'

import { IconGalleryStack, IconSparkles } from './post-dynamic-icons'

const SCREEN_HEIGHT = Dimensions.get('window').height
const COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.58
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.92
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
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList<DevicePhotoAsset>>(null)
  const [expanded, setExpanded] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [albumMenuOpen, setAlbumMenuOpen] = useState(false)
  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current

  const {
    permission,
    albums,
    selectedAlbumId,
    setSelectedAlbumId,
    assets,
    loading,
    loadingMore,
    error,
    hasMore,
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
      setExpanded(false)
      setSelectedIds([])
      setAlbumMenuOpen(false)
      sheetHeight.setValue(COLLAPSED_HEIGHT)
      return
    }

    Animated.timing(sheetHeight, {
      toValue: expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      duration: 240,
      useNativeDriver: false,
    }).start()
  }, [expanded, open, sheetHeight])

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

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
    if (contentOffset.y > 24 && !expanded) {
      setExpanded(true)
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

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(12, insets.bottom),
            },
          ]}
        >
          <Pressable onPress={toggleExpanded} style={styles.handleArea} accessibilityLabel="Expand">
            <View style={styles.handle} />
          </Pressable>

          <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
            <SheetCloseIcon />
          </Pressable>

          <SheetHeader
            title={t('character.createPage.imagePickerAddTitle')}
            hint={t('character.createPage.imagePickerAddHint')}
            style={styles.header}
          />

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

          {permission === null ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#000000" />
            </View>
          ) : !hasPhotoAccess(permission) ? (
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
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#000000" />
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('character.createPage.imagePickerLoadFailed')}</Text>
              <Pressable onPress={() => void reload()} style={styles.retryButton}>
                <Text style={styles.retryText}>{t('character.creation.retry')}</Text>
              </Pressable>
            </View>
          ) : assets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('character.createPage.imagePickerEmpty')}</Text>
            </View>
          ) : (
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
          )}

          {showConfirmFooter ? (
            <View style={styles.footer}>
              <Pressable
                disabled={confirming}
                onPress={() => void handleConfirm()}
                style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
              >
                {confirming ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmText}>
                    {t('character.createPage.imagePickerConfirm', {
                      count: selectedCount,
                      max: maxSelectable,
                    })}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  )
}

const PHOTO_SIZE =
  (Dimensions.get('window').width - 16 * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SHEET.backdrop,
  },
  sheet: {
    backgroundColor: SHEET.background,
    borderTopLeftRadius: SHEET.radius,
    borderTopRightRadius: SHEET.radius,
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: SHEET.handle.width,
    height: SHEET.handle.height,
    borderRadius: SHEET.handle.radius,
    backgroundColor: SHEET.handle.bg,
  },
  closeButton: {
    position: 'absolute',
    right: SHEET.close.right,
    top: SHEET.close.top,
    zIndex: 20,
  },
  header: {
    paddingBottom: 0,
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
    backgroundColor: '#fdeab3',
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
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  confirmButton: {
    height: SHEET.confirm.height,
    borderRadius: SHEET.confirm.radius,
    backgroundColor: SHEET.confirm.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: SHEET.confirm.disabledOpacity,
  },
  confirmText: {
    fontSize: SHEET.confirm.fontSize,
    fontWeight: SHEET.confirm.fontWeight,
    color: SHEET.confirm.textColor,
  },
})
