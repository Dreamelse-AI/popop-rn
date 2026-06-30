import type { EmojiItem, ListEmojiPanelResp } from '@/generated/arca_apiComponents'
import { registerSessionClearListener } from '@/shared/session/clear-user-session'

/** 「最近使用」最多缓存条数，与 fe 对齐 */
const RECENT_MAX = 24

/**
 * 表情面板会话缓存（对齐 fe 的 sessionStorage 缓存）：
 * RN 无 sessionStorage，用模块级内存缓存承担同样语义——
 * 同一登录会话内复用，登出 / 切游客时清空。
 */
let cachedPanel: ListEmojiPanelResp | null = null

export function readEmojiPanelSession(): ListEmojiPanelResp | null {
  return cachedPanel
}

export function writeEmojiPanelSession(panel: ListEmojiPanelResp): void {
  cachedPanel = panel
}

export function prependEmojiPanelRecent(
  panel: ListEmojiPanelResp,
  emoji: EmojiItem,
): ListEmojiPanelResp {
  const recent = [
    emoji,
    ...(panel.recent ?? []).filter(item => item.emoji_id !== emoji.emoji_id),
  ].slice(0, RECENT_MAX)
  return { ...panel, recent }
}

export function clearEmojiPanelSession(): void {
  cachedPanel = null
}

registerSessionClearListener(clearEmojiPanelSession)
