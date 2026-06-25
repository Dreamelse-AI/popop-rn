import { cdnImage } from '@/shared/lib/cdn';

const iconBack = cdnImage('assets/icon-back.png');
const iconSearch = cdnImage('assets/character/add-character/icon-search.png');
const characterAddCreateBack = cdnImage('assets/character/add-character/characterAddCreate-back.png');
const characterAddCreateCheck = cdnImage('assets/character/add-character/characterAddCreate-check.png');
const characterAddCreateDefaultImage = cdnImage('assets/character/add-character/characterAddCreate-defaultImage.png');
const characterAddCreateGreyHeart = cdnImage('assets/character/add-character/characterAddCreate-greyHeart.png');
const characterAddCreateRightGreyArrow = cdnImage('assets/character/add-character/characterAddCreate-rightGreyArrow.png');

export const addCharacterAssets = {
  iconBack,
  iconSearch,
};

export const addCharacterCreateAssets = {
  back: characterAddCreateBack,
  check: characterAddCreateCheck,
  defaultImage: characterAddCreateDefaultImage,
  greyHeart: characterAddCreateGreyHeart,
  rightGreyArrow: characterAddCreateRightGreyArrow,
};
