// 推荐页素材统一导出
import iconSearch from './icon/Frame 2117132466-1.svg';
import iconSearchSolid from './icon/icon-search-solid.svg';
import iconClose from './icon/Frame 2117132466.svg';
import iconLike from './icon/like 1.svg';
import iconMusic from './icon/音乐 1.svg';
import iconMoreImg from './icon/moreImg-icon.svg';
import iconFlash from './icon/white_image-flash-1-Streamline-Plump.svg';
import iconChat from './icon/black_mail_chat_bubble_oval_smiley-1_Streamline-Plump.svg';
import iconCreate from './icon/Group 2117131456.svg';
import iconSkull from './icon/black_interface_edit_skull_1_Streamline_Plump.svg';
import iconChevron from './icon/back.svg';
import iconUnreadRing from './icon/Ellipse 111367.svg';
import logoPopop from './icon/Group 2117132529.svg';
import promoCharacter from './icon/Frame 2117132547.svg';

import storyAvatar1 from './img/Ellipse 111366.png';
import storyAvatar2 from './img/Ellipse 111361.png';
import storyAvatar3 from './img/Ellipse 111361-1.png';
import storyAvatar4 from './img/Ellipse 111361-2.png';
import feedPostImage from './img/Frame 2117132555-3.png';
import recCard1 from './img/Frame 2117132556.png';
import recCard2 from './img/Frame 2117132555-1.png';
import recCard3 from './img/Frame 2117132555-2.png';
import characterAvatar from './img/jimeng-2026-03-24-8382-美男，狐狸耳朵，狐狸尾巴，灰蓝色蓬松头发，瓷肌冷白皮略显苍白、单凤眼，微眯垂眸、... 1.png';

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
