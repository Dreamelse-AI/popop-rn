// 角色 / 消息页素材统一导出
import { cdnImage } from '@/shared/lib/cdn';
const iconMenu = require('./back.svg');
const mascotEmpty = require('./popop-logo-grey.svg');
const sceneBanner = { uri: cdnImage('assets/character/character-banner.png') };
const creationDraftCardEmptyPattern = { uri: cdnImage('assets/character/creation-draft-card-empty-pattern.png') };
const tagPillBg = require('./character-rectangle.svg');
const iconLocation = require('./location.svg');
const iconPin = require('./dialog-pin.svg');
const iconEndRelation = require('./icon-feedback.svg');
const iconUnreadDot = require('./red-dot.svg');
const iconActiveDot = require('./white-dot.svg');
const avatar1 = require('./character-icon1.svg');
const avatar2 = require('./character-icon2.svg');
const avatar3 = require('./character-icon3.svg');
const dialogBubbleAbove = require('./dialog-union.svg');
const dialogBubbleBelow = require('./dialog-union2.svg');

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
