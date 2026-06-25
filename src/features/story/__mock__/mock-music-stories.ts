import type { StoryCharacter } from '../story-types'
import type { StoryHeadline } from '@/features/feed/story/types'

/**
 * 测试用：带可播放 mp3 BGM 的限时动态 mock 数据。
 * 仅在 __DEV__ 且 ENABLE_MOCK_MUSIC_STORIES=true 时注入到 story 会话最前面，
 * 用于验证「BGM 加载前进度条暂停 + 音乐控件静音，加载后自动播放 + 转动」与跨角色 BGM 预加载。
 *
 * BGM 用公开可访问的 mp3（SoundHelix 提供的示例曲目，cdn 直链可播放）。
 */
export const ENABLE_MOCK_MUSIC_STORIES = true

const MP3_1 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
const MP3_2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
const MP3_3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'

const IMG_1 = 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&q=80'
const IMG_2 = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80'
const IMG_3 = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80'
const IMG_4 = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'

const AVATAR_A = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'
const AVATAR_B = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80'

const now = Date.now()
const minsAgo = (m: number) => new Date(now - m * 60_000).toISOString()

export const MOCK_MUSIC_STORY_CHARACTERS: StoryCharacter[] = [
  {
    id: 'mock-music-char-1',
    name: '🎵 BGM测试A',
    avatar: AVATAR_A,
    hasUnread: true,
    stories: [
      {
        id: 'mock-music-story-1-1',
        type: 'image',
        images: [IMG_1],
        text: 'BGM 测试 1：加载中进度条应暂停、控件静音，加载好后自动播放并转动',
        createdAt: minsAgo(5),
        musicName: 'SoundHelix 1',
        musicUrl: MP3_1,
        likeCount: 12,
        commentCount: 3,
        isLiked: false,
      },
      {
        id: 'mock-music-story-1-2',
        type: 'image',
        images: [IMG_2],
        text: 'BGM 测试 2：切到这条应重新等待新 BGM 加载',
        createdAt: minsAgo(4),
        musicName: 'SoundHelix 2',
        musicUrl: MP3_2,
        likeCount: 8,
        commentCount: 1,
        isLiked: false,
      },
    ],
  },
  {
    id: 'mock-music-char-2',
    name: '🎶 BGM测试B',
    avatar: AVATAR_B,
    hasUnread: true,
    stories: [
      {
        id: 'mock-music-story-2-1',
        type: 'image',
        images: [IMG_3],
        text: 'BGM 测试 3：跨角色切换时这条 BGM 应已被预加载，几乎秒播',
        createdAt: minsAgo(3),
        musicName: 'SoundHelix 3',
        musicUrl: MP3_3,
        likeCount: 20,
        commentCount: 5,
        isLiked: false,
      },
      {
        id: 'mock-music-story-2-2',
        type: 'image',
        images: [IMG_4],
        text: 'BGM 测试 4：无 BGM 的对照（进度条不应等待）',
        createdAt: minsAgo(2),
        likeCount: 4,
        commentCount: 0,
        isLiked: false,
      },
    ],
  },
]

/** 顶部限时动态头像栏对应的 mock headline（DEV 注入用）。 */
export const MOCK_MUSIC_STORY_HEADLINES: StoryHeadline[] = MOCK_MUSIC_STORY_CHARACTERS.map(
  (c, i) => ({
    characterId: c.id,
    characterName: c.name,
    characterAvatarUrl: c.avatar,
    region: '',
    latestPublishedAt: now - i * 60_000,
    unread: c.hasUnread,
    storyCount: c.stories.length,
    storyIds: c.stories.map(s => s.id),
  }),
)
