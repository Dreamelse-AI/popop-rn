import type { ChatBackgroundUploadResult } from './chat-background-upload';

export type PhotoAlbumItem = {
  id: string;
  previewUrl: string;
  remoteUrl?: string;
  bkgMainColor?: string;
  createdAt: number;
};

export interface PhotoAlbumProvider {
  listRecentPhotos(): Promise<PhotoAlbumItem[]>;
  pickDevicePhotos(): Promise<File[]>;
  resolveSelectablePhoto(photoId: string): Promise<ChatBackgroundUploadResult>;
}
