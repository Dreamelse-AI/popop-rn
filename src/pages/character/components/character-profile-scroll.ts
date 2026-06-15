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
  bottomGap: 24,
  titleSubtitleGap: 6,
} as const

export const CHARACTER_PROFILE_HEADER_HEIGHT = 56

export const CHARACTER_PROFILE_SCROLL_SLOT_HEIGHT =
  CHARACTER_PROFILE_HEADER_HEIGHT +
  CHARACTER_PROFILE_HERO.collapsedHeight +
  CHARACTER_PROFILE_COLLAPSE_DISTANCE

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function getScrollProgress(scrollTop: number): number {
  return Math.min(Math.max(scrollTop / CHARACTER_PROFILE_COLLAPSE_DISTANCE, 0), 1)
}
