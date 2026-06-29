import { MOCK_CREATION_LATENCY_MS, USE_CHARACTER_CREATION_MOCK } from '@/features/character-creation/config';
import { createPost } from '@/generated/arca_api';
import type { StorageObject, UserUploadImage } from '@/generated/arca_apiComponents';

export type PublishCharacterPostParams = {
  characterId: string;
  content: string;
  images: StorageObject[];
  bgmMusicKey?: string | null;
};

function toUserUploadImage(storageObject: StorageObject): UserUploadImage {
  return {
    name: '',
    image_type: 'upload',
    media: storageObject,
  };
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

  const images = params.images
    .filter((img) => img.url || img.object_key)
    .map(toUserUploadImage);

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
