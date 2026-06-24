// 推荐页素材统一导出
const iconSearch = require('./icon/Frame 2117132466-1.svg');
const iconSearchSolid = require('./icon/icon-search-solid.svg');
const iconClose = require('./icon/Frame 2117132466.svg');
const iconLike = require('./icon/like 1.svg');
const iconMusic = require('./icon/音乐 1.svg');
const iconMoreImg = require('./icon/moreImg-icon.svg');
const iconFlash = require('./icon/white_image-flash-1-Streamline-Plump.svg');
const iconChat = require('./icon/black_mail_chat_bubble_oval_smiley-1_Streamline-Plump.svg');
const iconCreate = require('./icon/Group 2117131456.png');
const iconSkull = require('./icon/black_interface_edit_skull_1_Streamline_Plump.svg');
const iconChevron = require('./icon/back.svg');
const iconUnreadRing = require('./icon/Ellipse 111367.svg');
const logoPopop = require('./icon/Group 2117132529.svg');
const promoCharacter = require('./icon/Frame 2117132547.svg');

import { cdnImage } from '@/shared/lib/cdn';

const storyAvatar1 = { uri: cdnImage('assets/feed/img/Ellipse 111366.png') };
const storyAvatar2 = { uri: cdnImage('assets/feed/img/Ellipse 111361.png') };
const storyAvatar3 = { uri: cdnImage('assets/feed/img/Ellipse 111361-1.png') };
const storyAvatar4 = { uri: cdnImage('assets/feed/img/Ellipse 111361-2.png') };
const feedPostImage = { uri: cdnImage('assets/feed/img/Frame 2117132555-3.png') };
const recCard1 = { uri: cdnImage('assets/feed/img/Frame 2117132556.png') };
const recCard2 = { uri: cdnImage('assets/feed/img/Frame 2117132555-1.png') };
const recCard3 = { uri: cdnImage('assets/feed/img/Frame 2117132555-2.png') };
const characterAvatar = { uri: cdnImage('assets/feed/img/jimeng-2026-03-24-8382-美男，狐狸耳朵，狐狸尾巴，灰蓝色蓬松头发，瓷肌冷白皮略显苍白、单凤眼，微眯垂眸、... 1.png') };

export const feedAssets = {
  iconSearch,
  iconSearchSolid,
  iconClose,
  iconLike,
  iconMusic,
  iconMoreImg,
  iconFlash,
  iconChat,
  iconCreate,
  iconSkull,
  iconChevron,
  iconUnreadRing,
  logoPopop,
  promoCharacter,
  storyAvatar1,
  storyAvatar2,
  storyAvatar3,
  storyAvatar4,
  feedPostImage,
  recCard1,
  recCard2,
  recCard3,
  characterAvatar,
};

export const FEED_TAG_KEYS = ['tags.all', 'tags.yandere', 'tags.restraint', 'tags.newYear', 'tags.puppy', 'tags.loyal'] as const;

export const RECOMMENDED_ITEMS = [
  { id: '1', characterId: 'c1', image: recCard1, name: '션 싱휘', tags: '#연하남  #귀여움  #소유욕' },
  { id: '2', characterId: 'c1', image: recCard2, name: '션 싱휘', tags: '#연하남  #귀여움  #소유욕' },
  { id: '3', characterId: 'c1', image: recCard3, name: '션 싱휘', tags: '#연하남  #귀여움  #소유욕' },
] as const;
