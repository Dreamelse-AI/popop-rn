import { getChatCharacter } from '@/features/chat/mock/character.mock';

export type CharacterProfile = {
  id: string;
  name: string;
  avatar: string;
  heroImage: string;
  heroImageOverlay: string;
  tags: string;
  chatCount: string;
  imageCount: number;
};

const MOCK_PROFILES: Record<string, CharacterProfile> = {
  c1: {
    id: 'c1',
    name: '션 싱휘',
    avatar: 'https://picsum.photos/seed/avatar-c1/200/200',
    heroImage: 'https://picsum.photos/seed/hero-c1/400/300',
    heroImageOverlay: 'https://picsum.photos/seed/overlay-c1/400/300',
    tags: '#ENFP #연하남  #귀여움  #소유욕',
    chatCount: '121.1K',
    imageCount: 229,
  },
  c2: {
    id: 'c2',
    name: '지우 지우',
    avatar: 'https://picsum.photos/seed/avatar-c2/200/200',
    heroImage: 'https://picsum.photos/seed/hero-c2/400/300',
    heroImageOverlay: 'https://picsum.photos/seed/overlay-c2/400/300',
    tags: '#ENFP #연하남  #귀여움  #소유욕',
    chatCount: '98.2K',
    imageCount: 186,
  },
  c3: {
    id: 'c3',
    name: '루오시',
    avatar: 'https://picsum.photos/seed/avatar-c3/200/200',
    heroImage: 'https://picsum.photos/seed/hero-c3/400/300',
    heroImageOverlay: 'https://picsum.photos/seed/overlay-c3/400/300',
    tags: '#INTJ #츤데레  #카리스마',
    chatCount: '76.5K',
    imageCount: 142,
  },
  c4: {
    id: 'c4',
    name: '에 칭치',
    avatar: 'https://picsum.photos/seed/avatar-c4/200/200',
    heroImage: 'https://picsum.photos/seed/hero-c4/400/300',
    heroImageOverlay: 'https://picsum.photos/seed/overlay-c4/400/300',
    tags: '#ENFP #밝음  #활발',
    chatCount: '54.1K',
    imageCount: 98,
  },
};

export function getCharacterProfile(characterId: string): CharacterProfile | null {
  const profile = MOCK_PROFILES[characterId];
  if (profile) return profile;

  const chatCharacter = getChatCharacter(characterId);
  if (!chatCharacter) return null;

  return {
    id: chatCharacter.id,
    name: chatCharacter.name,
    avatar: chatCharacter.avatar,
    heroImage: 'https://picsum.photos/seed/hero-default/400/300',
    heroImageOverlay: 'https://picsum.photos/seed/overlay-default/400/300',
    tags: '#ENFP #연하남  #귀여움  #소유욕',
    chatCount: '121.1K',
    imageCount: 229,
  };
}
