export type AddableCharacterItem = {
  id: string;
  name: string;
  image: string;
};

export type CharacterSearchItem = {
  id: string;
  name: string;
  avatar: string;
  subtitle: string;
};

/** 进入角色落地页的来源，与 GetCharacterDetailReq.source 对齐 */
export type CharacterDetailSource =
  | 'feed'
  | 'user_page'
  | 'character_page'
  | 'notification'
  | 'direct';

export type CharacterDetailPageData = {
  characterId: string;
  characterName: string;
  htmlContent: string;
};

export type CharacterProfileData = {
  id: string;
  name: string;
  avatar: string;
  heroImage: string;
  heroImageOverlay: string;
  tags: string;
  chatCount: string;
};

export type CharacterProfileGridCell = {
  id: string;
  image: string;
  overlay?: string;
  showGalleryIcon?: boolean;
  showMusicIcon?: boolean;
};
