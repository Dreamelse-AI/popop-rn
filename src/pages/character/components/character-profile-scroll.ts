export const CHARACTER_PROFILE_COLLAPSE_DISTANCE = 230

export const CHARACTER_PROFILE_AVATAR = {
  expanded: 156,
  collapsed: 48,
} as const

export const CHARACTER_PROFILE_TITLE = {
  expanded: 30,
  collapsed: 20,
  expandedLineHeight: 34,
  collapsedLineHeight: 22,
} as const

export const CHARACTER_PROFILE_SUBTITLE = {
  expanded: 14,
  collapsed: 12,
  expandedLineHeight: 19,
  collapsedLineHeight: 14,
} as const

export const CHARACTER_PROFILE_HERO = {
  expandedHeight: 294,
  collapsedHeight: 60,
  horizontalInset: 12,
  avatarTextGap: 10,
  buttonWidth: 88,
  buttonHeight: 31,
  buttonTopGap: 6,
  bottomGap: 16,
  titleSubtitleGap: 6,
  /** 展开态头像区顶部留白 */
  expandedTopGap: 8,
  /** 卡片底部分割虚线与内容区间距 */
  dividerBottomInset: 12,
} as const

export const CHARACTER_PROFILE_HEADER_HEIGHT = 56

export const CHARACTER_PROFILE_SCROLL_SLOT_HEIGHT =
  CHARACTER_PROFILE_HEADER_HEIGHT +
  CHARACTER_PROFILE_HERO.collapsedHeight +
  CHARACTER_PROFILE_COLLAPSE_DISTANCE

/** 顶栏 + safe area 后的 hero 起始偏移 */
export function getCharacterProfileHeroTopOffset(safeTop: number): number {
  return CHARACTER_PROFILE_HEADER_HEIGHT + safeTop
}

/** 滚动区顶部占位（顶栏 + safe area + 折叠 hero + 展开行程） */
export function getCharacterProfileScrollSlotHeight(safeTop: number): number {
  return (
    CHARACTER_PROFILE_HEADER_HEIGHT +
    safeTop +
    CHARACTER_PROFILE_HERO.collapsedHeight +
    CHARACTER_PROFILE_COLLAPSE_DISTANCE
  )
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function getScrollProgress(scrollTop: number): number {
  return Math.min(Math.max(scrollTop / CHARACTER_PROFILE_COLLAPSE_DISTANCE, 0), 1)
}
