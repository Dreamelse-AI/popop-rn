/** 每刷拉取帖子数 */
export const FEED_PAGE_SIZE = 10;

/** 前 x 刷在第 2 条位置插入角色栏 */
export const FEED_INITIAL_CHARACTER_BRUSH_COUNT = 3;

/** 角色栏在单刷批次内的插入下标（0-based，即第 2 条） */
export const FEED_CHARACTER_ROW_SLOT_INDEX = 1;

/** 两次角色栏之间至少间隔的帖子数 */
export const FEED_CHARACTER_INSERT_COOLDOWN = 3;

/** 无交互时，每 x 条帖子保底插入一排角色 */
export const FEED_CHARACTER_GUARANTEE_INTERVAL = 10;

/** 老用户：每 x 条窗口至少 1 条好友新帖 */
export const FEED_FRIEND_POST_WINDOW = 10;

/** 新用户判定：注册 24h 内 */
export const NEW_USER_REGISTRATION_WINDOW_MS = 24 * 60 * 60 * 1000;

/** 角色栏横滑预览数量 */
export const FEED_CHARACTER_ROW_PREVIEW_LIMIT = 5;

/** 后端 rec_type 约定（角色） */
export const FEED_CHARACTER_REC_TYPE = {
  HOT: 'hot',
  PERSONALIZED: 'personalized',
  TAG_RELATED: 'tag_related',
} as const;

/** 查看全部推荐角色默认召回策略 */
export const FEED_MORE_CHARACTERS_STRATEGY = 'hot';

/** 首屏角色栏默认召回策略 */
export const FEED_HOT_RECALL_STRATEGY = 'hot';

/** 互动后角色召回策略 */
export const FEED_INTERACTION_RECALL_STRATEGY = 'interaction';

/** 帖子来源约定（待后端 RecPostEntity 补充后由 mapper 填充） */
export const FEED_POST_REC_SOURCE = {
  FRIEND_NEW: 'friend_new',
} as const;

/** 两次运营卡之间至少间隔的帖子数（前端兜底频控，后端策略优先） */
export const FEED_PROMO_MIN_POSTS_INTERVAL = 5;

/** 单用户单运营卡最大曝光次数（localStorage 持久化，后端策略优先） */
export const FEED_PROMO_MAX_EXPOSURES_PER_USER = 10;

/** 运营卡默认占位高度（px） */
export const FEED_PROMO_DEFAULT_HEIGHT = 400;
