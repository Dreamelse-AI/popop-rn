/** 「脑内判断」随机延时 [min, max] ms */
export const READ_DELAY_MS = { min: 5000, max: 10000 } as const;

/** 角色气泡间隔：delayMs = ceil(上一气泡字数 / CHARS_PER_SECOND * 1000) */
export const CHARS_PER_SECOND = 8;

/** 合并发送兜底 */
export const MAX_OUTBOUND_MESSAGES = 10;
export const MAX_OUTBOUND_WAIT_MS = 60_000;

/** 时间分隔条 */
export const TIMESTAMP_GAP_MS = 5 * 60_000;

/** 聊天历史上滑分页：每页条数（接口最大 100） */
export const HISTORY_PAGE_SIZE = 30;

/** 距顶部多少 px 触发加载更早历史 */
export const HISTORY_LOAD_MORE_THRESHOLD_PX = 80;

/** 距底部多少 px 以内视为「在最新消息」，新消息到达时自动滚底 */
export const HISTORY_NEAR_BOTTOM_THRESHOLD_PX = 120;

/** 额外回复（Q8） */
export const FOLLOW_UP_DELAY_MS = { min: 10000, max: 20000 } as const;
export const FOLLOW_UP_PROMPT = '用户没有回复你';

/** 解除关系后重新加好友 */
export const RE_FRIEND_SYSTEM_MESSAGE = '你们已经是好友了，开始聊天吧～';
export const RE_FRIEND_GREETING_PROMPT = '系统消息：用户之前删除好友后重新把你添加为好友';

/** Mock 网络延迟 */
export const MOCK_CHAT_LATENCY_MS = 800;

/** 用户语音展示时长上限（秒） */
export const VOICE_MAX_DISPLAY_SEC = 60;

/** 用户语音展示时长：charCount / 200 * 60 */
export const VOICE_CHARS_PER_MINUTE = 200;

/** 按住录音上移提示阈值（px），超过后提示继续上移 */
export const VOICE_RECORD_CANCEL_HINT_OFFSET_PX = 40;

/** 按住录音上移取消阈值（px），超过后进入取消区域 */
export const VOICE_RECORD_CANCEL_OFFSET_PX = 80;

/** 按住录音最短有效时长（ms），低于此值视为误触 */
export const VOICE_RECORD_MIN_DURATION_MS = 1000;

/** Mock 角色 TTS 示例音频（联调后替换为服务端 URL） */
export const MOCK_CHARACTER_VOICE_URL =
  'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';

/** Mock ASR 固定文案池 */
export const MOCK_VOICE_TRANSCRIPTS = [
  '今天天气不错，我们出去走走吧。',
  '我刚想到一件有趣的事，想跟你说说。',
  '嗯，我知道了，晚点再聊。',
] as const;

/** Mock ASR 模拟耗时 */
export const MOCK_VOICE_ASR_MS = 600;

/** 表情面板 — Figma 101:31262，宽度随 390 设计稿居中，高度随视口缩放 */
export const EMOJI_PANEL = {
  maxWidthPx: 390,
  horizontalInsetPx: 16,
  /** 328px @390 宽设计稿，小屏不超过 48dvh */
  heightCss: 'min(328px, 48dvh)',
  tabBarHeightPx: 70,
  tabRowHeightPx: 56,
  tabIconMaxHeightPx: 39,
  tabIconMaxWidthPx: 48,
  activeIndicatorWidthPx: 28,
  activeIndicatorHeightPx: 4,
  /** 仅滚动时展示的顶部渐隐高度 */
  scrollFadeHeightPx: 24,
} as const;

/** 额外回复是否走 ReadDelay（建议 false 或 0~1s） */
export const FOLLOW_UP_SKIP_READ_DELAY = true;
