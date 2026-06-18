import type { Media, UserPersonaItem } from '@/generated';

import type { PersonaGender } from '../types';

export const PERSONA_NAME_MAX = 10;
export const PERSONA_PROFILE_MAX = 300;

export function toPersonaGender(value?: string): PersonaGender {
  if (value === 'male') return 'male';
  if (value === 'other') return 'other';
  return 'female';
}

export function resolvePersonaAvatarUrl(avatar?: string | Media): string {
  const url = typeof avatar === 'string' ? avatar : avatar?.url;
  if (!url) return '';
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
  return '';
}

export function resolveActivePersona(
  items: UserPersonaItem[],
  appliedPersonaId: string | null,
): UserPersonaItem | null {
  if (appliedPersonaId) {
    const applied = items.find(item => item.persona_id === appliedPersonaId);
    if (applied) return applied;
  }
  return items.find(item => item.is_default) ?? items[0] ?? null;
}
