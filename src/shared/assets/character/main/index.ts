import { cdnImage } from '@/shared/lib/cdn';

const iconClose = cdnImage('assets/character/main/character-close.png');
const iconShare = cdnImage('assets/character/main/character-main-share.png');
const iconGallery = cdnImage('assets/character/main/character-union.png');
const iconMusic = cdnImage('assets/character/main/character-music.png');
const avatarRing = cdnImage('assets/character/main/character-avatar-while-circle.png');
const avatarGreyCircle = cdnImage('assets/character/main/character-avatar-grey-circle.png');
const badgeTail = cdnImage('assets/character/main/character-avatar-like-down.png');

const avatarMask = { uri: cdnImage('assets/character/main/Rectangle_346243755.png') };
const gridImage0 = { uri: cdnImage('assets/character/main/Frame_2117132557.png') };
const gridImage1 = { uri: cdnImage('assets/character/main/40d771a3cf5eec02423c6270e5fd88ca49bd8ff6.png') };
const gridImage2 = { uri: cdnImage('assets/character/main/f10cde6928ea1fb62d6094769cc2fefa6d058a82.png') };

export const characterMainAssets = {
  iconClose,
  iconShare,
  iconGallery,
  iconMusic,
  avatarRing,
  avatarGreyCircle,
  badgeTail,
  avatarMask,
  gridImage0,
  gridImage1,
  gridImage2,
};

export type CharacterGridCell = {
  id: string;
  image: { uri: string };
  overlay?: { uri: string };
  showGalleryIcon?: boolean;
  showMusicIcon?: boolean;
};

/** 角色主页内容网格 mock（Figma 625:5447） */
export const CHARACTER_PROFILE_GRID_CELLS: CharacterGridCell[] = [
  { id: 'r0c0', image: gridImage0, showGalleryIcon: true, showMusicIcon: true },
  { id: 'r0c1', image: gridImage1 },
  { id: 'r0c2', image: gridImage2, overlay: gridImage1 },
  { id: 'r1c0', image: gridImage2 },
  { id: 'r1c1', image: gridImage0 },
  { id: 'r1c2', image: gridImage1, overlay: gridImage2 },
  { id: 'r2c0', image: gridImage1 },
  { id: 'r2c1', image: gridImage2 },
  { id: 'r2c2', image: gridImage0 },
  { id: 'r3c0', image: gridImage0, overlay: gridImage2 },
  { id: 'r3c1', image: gridImage1 },
  { id: 'r3c2', image: gridImage2, overlay: gridImage1 },
  { id: 'r4c0', image: gridImage0 },
  { id: 'r4c1', image: gridImage1, overlay: gridImage0 },
  { id: 'r4c2', image: gridImage2 },
  { id: 'r5c0', image: gridImage2 },
  { id: 'r5c1', image: gridImage0 },
  { id: 'r5c2', image: gridImage1, overlay: gridImage2 },
  { id: 'r6c0', image: gridImage0 },
  { id: 'r6c1', image: gridImage1, overlay: gridImage0 },
  { id: 'r6c2', image: gridImage2 },
];
