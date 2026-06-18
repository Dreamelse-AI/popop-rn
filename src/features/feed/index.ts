// Feed 模块统一导出（含 Story 头像栏子域）
export type {
  Character,
  CharacterRowReason,
  FeedLayoutItem,
  FeedPost,
  FeedRefreshResponse,
  FeedStreamItem,
  FeedTopTag,
  HomeFeedCharacter,
  HomeFeedPost,
  HomeFeedPromo,
  HomeFeedResponse,
} from './feed-types';
export { feedApi } from './feed-api';
export {
  markFeedTabLeft,
  clearFeedTabLeft,
  shouldRefreshFeedOnReturn,
  saveFeedScrollTop,
  takeFeedScrollTop,
  getFeedListSnapshot,
  saveFeedListSnapshot,
  clearFeedSessionState,
  FEED_TAB_STATE_TTL,
} from './feed-session';
export { useFeed, type FeedRefreshOutcome } from './hooks/use-feed';
export { useRecommendedMore } from './hooks/use-recommended-more';
export {
  FEED_RECOMMENDED_PREVIEW_LIMIT,
  RECOMMENDED_MORE_PAGE_SIZE,
  buildRecommendedGridRows,
  shouldUseBadgeBlur,
  type RecommendedMoreLocationState,
} from './lib/recommended-characters';
export { FeedCharacterCard } from './ui/feed-character-card';
export { FeedPromoCard } from './ui/feed-promo-card';
export {
  FEED_CHARACTER_GUARANTEE_INTERVAL,
  FEED_CHARACTER_INSERT_COOLDOWN,
  FEED_INITIAL_CHARACTER_BRUSH_COUNT,
  FEED_PAGE_SIZE,
  FEED_PROMO_DEFAULT_HEIGHT,
  FEED_PROMO_MAX_EXPOSURES_PER_USER,
  FEED_PROMO_MIN_POSTS_INTERVAL,
} from './lib/feed-layout-config';
export { sanitizeAdjacentCharacterRows } from './lib/feed-layout-engine';
export { isNewFeedUser } from './lib/feed-user-context';

export type {
  StoryBarSectionRef,
  StoryCharacterClickPayload,
  StoryHeadline,
  StoryHeadlineList,
} from './story';
export {
  areAllHeadlineStoriesRead,
  StoryBarSection,
  StoryBar,
  storyApi,
  useStoryHeadline,
} from './story';
