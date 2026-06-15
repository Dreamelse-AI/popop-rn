import * as ImagePicker from 'expo-image-picker'

import type { PhotoAlbumItem } from './photo-album-types'

export async function pickDevicePhotos(): Promise<string[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
  })

  if (result.canceled) return []
  return result.assets.map(asset => asset.uri)
}

export async function loadRecentPhotoItems(): Promise<PhotoAlbumItem[]> {
  return []
}

export async function addPickedPhotos(uris: string[]): Promise<PhotoAlbumItem[]> {
  const createdAt = Date.now()
  return uris.map((uri, index) => ({
    id: `recent-${createdAt}-${index}`,
    previewUrl: uri,
    remoteUrl: undefined,
    bkgMainColor: undefined,
    createdAt: createdAt + index,
  }))
}

export function revokePhotoPreviewUrls(_items: PhotoAlbumItem[]): void {
  // RN 无 blob URL，不需要释放
}
