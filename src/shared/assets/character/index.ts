import { cdnImage } from '@/shared/lib/cdn';

const iconMenu = cdnImage('assets/character/back.png');
const mascotEmpty = cdnImage('assets/character/popop-logo-grey.png');
const sceneBanner = { uri: cdnImage('assets/character/character-banner.png') };
const creationDraftCardEmptyPattern = { uri: cdnImage('assets/character/creation-draft-card-empty-pattern.png') };
const tagPillBg = cdnImage('assets/character/character-rectangle.png');
const iconLocation = cdnImage('assets/character/location.png');
const iconPin = cdnImage('assets/character/dialog-pin.png');
const iconEndRelation = cdnImage('assets/character/icon-feedback.png');
const iconUnreadDot = cdnImage('assets/character/red-dot.png');
const iconActiveDot = cdnImage('assets/character/white-dot.png');
const avatar1 = cdnImage('assets/character/character-icon1.png');
const avatar2 = cdnImage('assets/character/character-icon2.png');
const avatar3 = cdnImage('assets/character/character-icon3.png');
const dialogBubbleAbove = cdnImage('assets/character/dialog-union.png');
const dialogBubbleBelow = cdnImage('assets/character/dialog-union2.png');

export const characterAssets = {
  iconMenu,
  mascotEmpty,
  sceneBanner,
  creationDraftCardEmptyPattern,
  tagPillBg,
  iconLocation,
  iconPin,
  iconEndRelation,
  iconUnreadDot,
  iconActiveDot,
  avatar1,
  avatar2,
  avatar3,
  /** 置顶头像上方气泡（尾向下） */
  dialogBubbleAbove,
  /** 置顶头像下方气泡（尾向上） */
  dialogBubbleBelow,
};
