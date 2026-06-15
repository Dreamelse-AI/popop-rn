import type { PostInfo } from '@/generated';
import { MOCK_CHARACTER_VOICE_URL } from '@/features/chat/config/chat-config';

const IMG = {
  a: 'https://picsum.photos/seed/mock-a/400/600',
  b: 'https://picsum.photos/seed/mock-b/400/600',
  c: 'https://picsum.photos/seed/mock-c/400/600',
} as const;

const MOCK_BGM = {
  id: 'mock-bgm',
  url: MOCK_CHARACTER_VOICE_URL,
  name: '밤의 정원',
  media_type: 'audio',
} as const;

function image(url: string, id: string) {
  return { id, url, media_type: 'image' };
}

function createMockPost(
  postId: string,
  options: {
    content: string;
    images: string[];
    publishedAtMs: number;
    hasBgm?: boolean;
    isLiked?: boolean;
  },
): PostInfo {
  const { content, images, publishedAtMs, hasBgm = false, isLiked = false } = options;

  return {
    post_id: postId,
    author: {
      author_type: 2,
      author_id: 'mock-character',
      display_name: '션 싱휘',
    },
    content,
    images: images.map((url, index) => image(url, `${postId}-img-${index}`)),
    bgm: hasBgm ? { ...MOCK_BGM } : undefined,
    visibility: 1,
    status: 2,
    like_count: 0,
    comment_count: 0,
    is_liked: isLiked,
    published_at: publishedAtMs,
    created_at: publishedAtMs,
  };
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** 角色主页帖子 mock：覆盖单图、多图、带 BGM 等场景 */
export function getMockCharacterProfilePosts(characterId: string): PostInfo[] {
  const now = Date.now();

  return [
    // 多图 + BGM
    createMockPost(`mock-post-${characterId}-01`, {
      content: '그는 언제나 정시에 발코니에 나타나, 온 힘을 다해 풍속과 햇빛을 꼼꼼하게 측정했다.',
      images: [IMG.a, IMG.b],
      publishedAtMs: now - DAY,
      hasBgm: true,
      isLiked: true,
    }),
    // 多图
    createMockPost(`mock-post-${characterId}-02`, {
      content: '오늘은 바람이 조금 더 시원하게 느껴졌다. 창문을 열고 잠시 서 있었다.',
      images: [IMG.b, IMG.c, IMG.a],
      publishedAtMs: now - 2 * DAY,
    }),
    // 单图 + BGM
    createMockPost(`mock-post-${characterId}-03`, {
      content: '밤이 되면 별빛 아래서만 들리는 작은 노래가 있다.',
      images: [IMG.c],
      publishedAtMs: now - 3 * HOUR,
      hasBgm: true,
    }),
    // 单图
    createMockPost(`mock-post-${characterId}-04`, {
      content: '햇살이 비스듬히 들어오는 시간, 나는 항상 같은 자리에 앉아 있었다.',
      images: [IMG.a],
      publishedAtMs: now - 5 * DAY,
    }),
    // 多图 + BGM
    createMockPost(`mock-post-${characterId}-05`, {
      content: '두 장의 사진에는 같은 하늘이, 다른 온도가 담겨 있었다.',
      images: [IMG.c, IMG.a],
      publishedAtMs: now - 8 * DAY,
      hasBgm: true,
    }),
    // 多图
    createMockPost(`mock-post-${characterId}-06`, {
      content: '창밖의 나무가 바람에 흔들릴 때마다 그림자가 천천히 움직였다.',
      images: [IMG.a, IMG.b],
      publishedAtMs: now - 12 * DAY,
    }),
    // 单图
    createMockPost(`mock-post-${characterId}-07`, {
      content: '가끔은 말하지 않는 것이 더 많은 것을 전한다.',
      images: [IMG.b],
      publishedAtMs: now - 20 * DAY,
    }),
    // 多图
    createMockPost(`mock-post-${characterId}-08`, {
      content: '세 장의 사진을 넘기며, 같은 하루의 다른 순간들을 떠올렸다.',
      images: [IMG.b, IMG.c, IMG.a],
      publishedAtMs: now - 25 * DAY,
    }),
    // 单图 + BGM
    createMockPost(`mock-post-${characterId}-09`, {
      content: '음악이 켜지면 공기가 조금 더 부드러워지는 것 같다.',
      images: [IMG.a],
      publishedAtMs: now - 45 * DAY,
      hasBgm: true,
    }),
    // 单图
    createMockPost(`mock-post-${characterId}-10`, {
      content: '오래 기다린 끝에 드디어 맑은 하늘이 돌아왔다.',
      images: [IMG.c],
      publishedAtMs: now - 60 * DAY,
    }),
    // 多图 + BGM
    createMockPost(`mock-post-${characterId}-11`, {
      content: '두 장의 사진과 한 곡의 음악, 그것으로 충분했다.',
      images: [IMG.a, IMG.c],
      publishedAtMs: now - 90 * DAY,
      hasBgm: true,
    }),
    // 多图
    createMockPost(`mock-post-${characterId}-12`, {
      content: '마지막 장면은 항상 가장 조용하고, 가장 선명하게 남는다.',
      images: [IMG.c, IMG.b],
      publishedAtMs: now - 120 * DAY,
    }),
  ];
}

function readMockCharacterPostsFlag(): string | undefined {
  return undefined;
}

export function shouldUseMockCharacterPosts(): boolean {
  const flag = readMockCharacterPostsFlag();
  if (flag === 'true' || flag === '1' || flag === 'yes') return true;
  if (flag === 'false' || flag === '0' || flag === 'no') return false;
  return __DEV__;
}
