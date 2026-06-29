import { cdnImage } from '@/shared/lib/cdn';

const iconSearch = cdnImage('assets/feed/icon/Frame_2117132466-1.png');
const iconSearchSolid = cdnImage('assets/feed/icon/icon-search-solid.png');
const iconClose = cdnImage('assets/feed/icon/Frame_2117132466.png');
const iconLike = cdnImage('assets/feed/icon/like_1.png');
const iconMusic = cdnImage('assets/feed/icon/music_1.png');
const iconMoreImg = cdnImage('assets/feed/icon/moreImg-icon.png');
const iconFlash = cdnImage('assets/feed/icon/white_image-flash-1-Streamline-Plump.png');
const iconChat = cdnImage('assets/feed/icon/chat.svg');
const iconCreate = cdnImage('assets/feed/icon/Group_2117131456.png');
const iconSkull = cdnImage('assets/feed/icon/mine.svg');
const iconChevron = cdnImage('assets/feed/icon/back.png');
const iconUnreadRing = cdnImage('assets/feed/icon/Ellipse_111367.png');
const promoCharacter = cdnImage('assets/feed/icon/Frame_2117132547.png');

/** popop logo PNG，用于网络图片场景（<Image uri>） */
export const LOGO_POPOP_PNG = cdnImage('assets/feed/icon/Group_2117132529.png');

const storyAvatar1 = { uri: cdnImage('assets/feed/img/Ellipse_111366.png') };
const storyAvatar2 = { uri: cdnImage('assets/feed/img/Ellipse_111361.png') };
const storyAvatar3 = { uri: cdnImage('assets/feed/img/Ellipse_111361-1.png') };
const storyAvatar4 = { uri: cdnImage('assets/feed/img/Ellipse_111361-2.png') };
const feedPostImage = { uri: cdnImage('assets/feed/img/Frame_2117132555-3.png') };
const recCard1 = { uri: cdnImage('assets/feed/img/Frame_2117132556.png') };
const recCard2 = { uri: cdnImage('assets/feed/img/Frame_2117132555-1.png') };
const recCard3 = { uri: cdnImage('assets/feed/img/Frame_2117132555-2.png') };
const characterAvatar = { uri: cdnImage('assets/feed/img/character-avatar.png') };

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
