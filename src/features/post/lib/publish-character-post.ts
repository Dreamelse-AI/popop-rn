import { MOCK_CREATION_LATENCY_MS, USE_CHARACTER_CREATION_MOCK } from '@/features/character-creation/config';
import { createPost, publishPost } from '@/generated/arca_api';
import type { Media, PostLinkedItem } from '@/generated/arca_apiComponents';

export type PublishCharacterPostParams = {
  characterId: string;
  characterName: string;
  characterCoverUrl?: string | null;
  content: string;
  imageUrls: string[];
};

function toImageMedia(url: string, id: string): Media {
  return { id, url, media_type: 'image' };
}

function buildLinkedCharacterItem(params: PublishCharacterPostParams): PostLinkedItem {
  const coverUrl =
    params.characterCoverUrl?.trim() ||
    params.imageUrls[0]?.trim() ||
    '';

  return {
    item_type: 1,
    item_id: params.characterId,
    cover: toImageMedia(coverUrl, 'character-cover'),
    title: params.characterName,
    content: '',
  };
}

async function mockPublishCharacterPost(): Promise<string> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_CREATION_LATENCY_MS * 2);
  });
  return `mock-post-${Date.now()}`;
}

export async function publishCharacterPost(params: PublishCharacterPostParams): Promise<string> {
  if (USE_CHARACTER_CREATION_MOCK) {
    return mockPublishCharacterPost();
  }

  const images = params.imageUrls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => toImageMedia(url, `post-image-${index}`));

  const content = params.content.trim();

  const createResp = await createPost({
    content: content || undefined,
    images: images.length ? images : undefined,
    visibility: 1,
    linked_items: [buildLinkedCharacterItem(params)],
  });

  await publishPost({ post_id: createResp.post_id });
  return createResp.post_id;
}
