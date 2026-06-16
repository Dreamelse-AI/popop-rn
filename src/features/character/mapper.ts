import type { CharacterDetailInfo, ListCopyableCharactersResp, PostInfo } from '@/generated';
import { resolveCharacterAvatar } from '@/features/chat/lib/character-adapter';
import { mapCharacterPosts, type CharacterPostView } from '@/features/post/post-mapper';

import type { GetCharacterDetailPageResp } from './api';
import type {
  AddableCharacterItem,
  CharacterDetailPageData,
  CharacterProfileData,
  CharacterProfileGridCell,
  CharacterSearchItem,
} from './types';

function formatCompactCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(value);
}

function formatCharacterTags(character: CharacterDetailInfo): string {
  const skillTags =
    character.skills?.map(skill => `#${skill.skill_name}`).filter(Boolean) ?? [];
  if (skillTags.length > 0) return skillTags.join('  ');

  const aboutTags =
    character.about
      ?.map(item => (item.title ? `#${item.title}` : ''))
      .filter(Boolean) ?? [];
  return aboutTags.join('  ');
}

function resolveHeroImages(character: CharacterDetailInfo): {
  heroImage: string;
  heroImageOverlay: string;
} {
  const outfit =
    character.outfits?.find(item => item.outfit_id === character.current_outfit_id) ??
    character.outfits?.find(item => item.in_use) ??
    character.outfits?.[0];

  const appearances = outfit?.appearances ?? [];
  const currentAppearance =
    appearances.find(item => item.appearance_id === character.current_appearance_id) ??
    appearances.find(item => item.in_use) ??
    appearances[0];
  const secondAppearance = appearances.find(
    item => item.appearance_id !== currentAppearance?.appearance_id,
  );

  const splash = character.splash_img?.url ?? '';
  const heroImage = splash || currentAppearance?.image.url || '';
  const heroImageOverlay = secondAppearance?.image.url || splash || heroImage;

  return { heroImage, heroImageOverlay };
}

export function mapCharacterProfile(character: CharacterDetailInfo): CharacterProfileData | null {
  const avatar = resolveCharacterAvatar(character);
  const { heroImage, heroImageOverlay } = resolveHeroImages(character);

  if (!avatar && !heroImage) return null;

  return {
    id: character.character_id,
    name: character.name ?? character.aka ?? '角色',
    avatar: avatar || heroImage,
    heroImage: heroImage || avatar,
    heroImageOverlay: heroImageOverlay || heroImage || avatar,
    tags: formatCharacterTags(character),
    chatCount: formatCompactCount(character.like_count ?? 0),
  };
}

export function mapPostsToProfileGridCells(posts: PostInfo[]): CharacterProfileGridCell[] {
  return mapCharacterPosts(posts).map((post: CharacterPostView) => ({
    id: post.postId,
    image: post.images[0]!,
    showGalleryIcon: post.images.length > 1,
    showMusicIcon: post.hasBgm,
  }));
}

export function mapCharacterDetailPage(
  resp: GetCharacterDetailPageResp,
): Pick<CharacterDetailPageData, 'characterId' | 'characterName' | 'landingPageUrl'> {
  return {
    characterId: resp.character.character_id,
    characterName: resp.character.name ?? '',
    landingPageUrl: resp.character.landing_page_urls?.[0]?.trim() ?? '',
  };
}

export function mapCopyableToAddableCharacters(
  resp: ListCopyableCharactersResp,
): AddableCharacterItem[] {
  return resp.characters
    .map(character => ({
      id: character.character_id,
      name: character.name ?? '',
      image: character.image?.url ?? '',
    }))
    .filter(item => item.image !== '');
}

export function mapCopyableToSearchItems(
  resp: ListCopyableCharactersResp,
): CharacterSearchItem[] {
  return resp.characters.map(character => ({
    id: character.character_id,
    name: character.name ?? '',
    avatar: character.image?.url ?? '',
    subtitle: character.aka ?? '',
  }));
}
