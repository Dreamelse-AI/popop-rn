import { MOCK_CREATION_LATENCY_MS, USE_CHARACTER_CREATION_MOCK } from '@/features/character-creation/config';
import { createPost } from '@/generated/arca_api';
import type { Media } from '@/generated/arca_apiComponents';

export type PublishCharacterPostParams = {
  characterId: string;
  content: string;
  imageUrls: string[];
  bgmMusicKey?: string | null;
};

function toImageMedia(url: string, id: string): Media {
  return { id, url, media_type: 'image' };
}

async function mockPublishCharacterPost(): Promise<string> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_CREATION_LATENCY_MS * 2);
  });
  return `mock-post-${Date.now()}`;
}

/** 创建并发布角色动态：POST /post/create */
export async function publishCharacterPost(params: PublishCharacterPostParams): Promise<string> {
  if (USE_CHARACTER_CREATION_MOCK) {
    return mockPublishCharacterPost();
  }

  const characterId = params.characterId.trim();
  if (!characterId) {
    throw new Error('characterId is required to publish character post');
  }

  const images = params.imageUrls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => toImageMedia(url, `post-image-${index}`));

  const content = params.content.trim();
  const bgmMusicKey = params.bgmMusicKey?.trim();

  const createResp = await createPost({
    character_id: characterId,
    content: content || undefined,
    images: images.length ? images : undefined,
    visibility: 1,
    bgm_music_key: bgmMusicKey || undefined,
  });

  return createResp.post_id;
}
