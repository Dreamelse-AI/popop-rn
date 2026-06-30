import type { Media, UserPersonaItem } from '@/generated';
import { userAvatarPlaceholder } from '@/shared/assets/user-avatar';

import type { PersonaGender } from '../types';

export { userAvatarPlaceholder };

export const PERSONA_NAME_MAX = 10;
export const PERSONA_PROFILE_MAX = 200;

/**
 * 自设名称裁剪到上限（按真实字符数，正确处理 emoji/代理对）。
 *
 * 注意：RN 的 TextInput 没有 Web 的 compositionstart/end 事件，也无法区分「拼音组合中」
 * 与「已上屏」。若在 onChangeText 里逐键裁剪（或用 maxLength），未上屏的拼音字母会被
 * 当作字符计数、提前截断，导致中文打不全。因此 onChangeText 不裁剪，仅在 onBlur 与
 * 保存（normalizePersonaName）时调用本函数收口长度（对应 FE 的 compositionend 后裁剪）。
 */
export function clampPersonaNameInput(name: string): string {
  return Array.from(name).slice(0, PERSONA_NAME_MAX).join('');
}

export function normalizePersonaName(name: string): string {
  return clampPersonaNameInput(name.trim());
}

/** 将「当前」人设排到首位；无当前或已在首位则原样返回 */
export function sortPersonasCurrentFirst(items: UserPersonaItem[]): UserPersonaItem[] {
  const currentIndex = items.findIndex(item => item.is_current);
  if (currentIndex <= 0) return items;
  const current = items[currentIndex];
  if (!current) return items;
  return [current, ...items.filter((_, index) => index !== currentIndex)];
}

export function toPersonaGender(value?: string): PersonaGender {
  if (value === 'male') return 'male';
  if (value === 'other') return 'other';
  return 'female';
}

export function resolvePersonaAvatarUrl(avatar?: string | Media): string {
  const url = typeof avatar === 'string' ? avatar : avatar?.url;
  if (!url) return userAvatarPlaceholder;
  if (
    url.startsWith('blob:') ||
    url.startsWith('file://') ||
    url.startsWith('ph://') ||
    url.startsWith('content://') ||
    url.startsWith('assets-library://')
  ) {
    return url;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return userAvatarPlaceholder;
}

export function resolveActivePersona(
  items: UserPersonaItem[],
  appliedPersonaId: string | null,
): UserPersonaItem | null {
  if (appliedPersonaId) {
    const applied = items.find(item => item.persona_id === appliedPersonaId);
    if (applied) return applied;
  }
  return items.find(item => item.is_current) ?? items[0] ?? null;
}
