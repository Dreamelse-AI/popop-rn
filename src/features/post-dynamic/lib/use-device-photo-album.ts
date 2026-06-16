import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Linking, Platform } from 'react-native'
import * as MediaLibrary from 'expo-media-library/legacy'

export type DevicePhotoAlbum = {
  id: string
  title: string
}

export type DevicePhotoAsset = {
  id: string
  uri: string
  width: number
  height: number
}

type UseDevicePhotoAlbumOptions = {
  enabled: boolean
  pageSize?: number
}

export function hasPhotoAccess(permission: MediaLibrary.PermissionResponse | null) {
  if (!permission?.granted) return false
  if (permission.accessPrivileges === 'none') return false
  return true
}

export function useDevicePhotoAlbum({ enabled, pageSize = 60 }: UseDevicePhotoAlbumOptions) {
  const [permission, setPermission] = useState<MediaLibrary.PermissionResponse | null>(null)
  const [albums, setAlbums] = useState<DevicePhotoAlbum[]>([])
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const [assets, setAssets] = useState<DevicePhotoAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [requestingPermission, setRequestingPermission] = useState(false)
  const [error, setError] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const endCursorRef = useRef<string | undefined>(undefined)

  const loadAlbums = useCallback(async () => {
    const result = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true })
    const nextAlbums = result
      .filter((album) => album.assetCount > 0)
      .map((album) => ({ id: album.id, title: album.title }))
    setAlbums(nextAlbums)
    setSelectedAlbumId((current) => current ?? nextAlbums[0]?.id ?? null)
  }, [])

  const refreshPermission = useCallback(async () => {
    const result = await MediaLibrary.getPermissionsAsync()
    setPermission(result)
    if (hasPhotoAccess(result)) {
      await loadAlbums()
    }
    return result
  }, [loadAlbums])

  const requestPermission = useCallback(async () => {
    setRequestingPermission(true)
    try {
      const current = await MediaLibrary.getPermissionsAsync()
      if (hasPhotoAccess(current)) {
        setPermission(current)
        if (albums.length === 0) {
          await loadAlbums()
        }
        return current
      }

      if (current.canAskAgain === false) {
        await Linking.openSettings()
        return current
      }

      const result = await MediaLibrary.requestPermissionsAsync(
        false,
        Platform.OS === 'android' ? ['photo'] : undefined,
      )
      setPermission(result)
      if (hasPhotoAccess(result)) {
        await loadAlbums()
      }
      return result
    } catch {
      setError(true)
      return null
    } finally {
      setRequestingPermission(false)
    }
  }, [albums.length, loadAlbums])

  const loadAssets = useCallback(
    async (mode: 'reset' | 'more') => {
      if (!hasPhotoAccess(permission)) return

      if (mode === 'reset') {
        setLoading(true)
        setError(false)
        endCursorRef.current = undefined
      } else {
        setLoadingMore(true)
      }

      try {
        const page = await MediaLibrary.getAssetsAsync({
          first: pageSize,
          after: mode === 'more' ? endCursorRef.current : undefined,
          album: selectedAlbumId ?? undefined,
          mediaType: MediaLibrary.MediaType.photo,
          sortBy: [MediaLibrary.SortBy.creationTime],
        })

        const nextAssets: DevicePhotoAsset[] = page.assets.map((asset) => ({
          id: asset.id,
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        }))

        setAssets((prev) => (mode === 'reset' ? nextAssets : [...prev, ...nextAssets]))
        endCursorRef.current = page.endCursor
        setHasMore(page.hasNextPage)
      } catch {
        if (mode === 'reset') {
          setAssets([])
          setError(true)
        }
        setHasMore(false)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [pageSize, permission, selectedAlbumId],
  )

  useEffect(() => {
    if (!enabled) {
      setAssets([])
      setAlbums([])
      setSelectedAlbumId(null)
      setPermission(null)
      setError(false)
      setHasMore(true)
      setRequestingPermission(false)
      endCursorRef.current = undefined
      return
    }

    void refreshPermission()
  }, [enabled, refreshPermission])

  useEffect(() => {
    if (!enabled || !hasPhotoAccess(permission)) return
    void loadAssets('reset')
  }, [enabled, loadAssets, permission, selectedAlbumId])

  useEffect(() => {
    if (!enabled) return

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshPermission()
      }
    })

    return () => subscription.remove()
  }, [enabled, refreshPermission])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return
    void loadAssets('more')
  }, [hasMore, loadAssets, loading, loadingMore])

  const needsSettings = permission != null && !hasPhotoAccess(permission) && permission.canAskAgain === false

  return {
    permission,
    albums,
    selectedAlbumId,
    setSelectedAlbumId,
    assets,
    loading,
    loadingMore,
    requestingPermission,
    needsSettings,
    error,
    hasMore,
    requestPermission,
    reload: () => void loadAssets('reset'),
    loadMore,
  }
}

export async function resolveDevicePhotoUri(assetId: string): Promise<string> {
  const info = await MediaLibrary.getAssetInfoAsync(assetId)
  return info.localUri ?? info.uri
}
