// 角色主页素材统一导出（Figma 625:5346）
import iconClose from './character-close.svg';
import iconShare from './character-main-share.svg';
import iconGallery from './character-union.svg';
import iconMusic from './character-music.svg';
import avatarRing from './character-avatar-while-circle.svg';
import avatarGreyCircle from './character-avatar-grey-circle.svg';
import badgeTail from './character-avatar-like-down.svg';
import avatarMask from './Rectangle 346243755.png';
import gridImage0 from './Frame 2117132557.png';
import gridImage1 from './40d771a3cf5eec02423c6270e5fd88ca49bd8ff6.png';
import gridImage2 from './f10cde6928ea1fb62d6094769cc2fefa6d058a82.png';

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
  image: number;
  /** 叠加图（部分格子为双层） */
  overlay?: number;
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
