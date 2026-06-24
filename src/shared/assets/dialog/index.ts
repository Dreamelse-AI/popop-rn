// 角色聊天页素材统一导出
const iconPlus = require('./dialog-plus.svg');
const iconEmoji = require('./dialog-emoji.svg');
const iconVoice = require('./dialog-voice.svg');
const iconVoiceUnion = require('./dialog-voice-union.svg');
const iconVoiceReceive = require('./dialog-message-voice-receive.svg');
const iconVoiceSend = require('./dialog-message-voice-send.svg');
const iconWaiting = require('./dialog-waiting.svg');
const iconWarning = require('./dialog-warning.svg');
const bubbleTailWhite = require('./dialog-pop-down-white.svg');
const bubbleTailYellow = require('./dialog-pop-down-yellow.svg');
const characterAvatarPlaceholder = require('./character-icon.svg');
const iconBlackSend = require('./dialog-black-send.svg');
const iconBlackEmoji = require('./dialog-black-emoji.svg');
const iconKeyboard = require('./dialog-keyboard.svg');
const iconTopLeftBack = require('./dialog-topleft-back.svg');
const iconTopLeftTag = require('./dialog-topleft-tag.svg');
const iconTopRightMenu = require('./dialog-topright-back.svg');
import { cdnImage } from '@/shared/lib/cdn';
const dialogSettingsOption = require('./dialogSettings-option.svg');
const dialogSettingsRightBack = require('./dialogSettings-rightBack.svg');
const dialogSettingsDownBack = require('./dialogSettings-downBack.svg');
const dialogSettingsTempIcon = { uri: cdnImage('assets/dialog/dialogSettings-tempIcon.png') };

export const dialogAssets = {
  iconPlus,
  iconEmoji,
  iconBlackEmoji,
  iconKeyboard,
  iconVoice,
  iconBlackSend,
  iconVoiceUnion,
  iconVoiceReceive,
  iconVoiceSend,
  iconWaiting,
  iconWarning,
  bubbleTailWhite,
  bubbleTailYellow,
  characterAvatarPlaceholder,
  iconTopLeftBack,
  iconTopLeftTag,
  iconTopRightMenu,
  dialogSettingsOption,
  dialogSettingsRightBack,
  dialogSettingsDownBack,
  dialogSettingsTempIcon,
};
