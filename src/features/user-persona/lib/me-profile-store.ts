import { create } from 'zustand';

import { getUserInfo } from '@/generated';
import type { UserPersonaItem } from '@/generated';

import { apiClient } from '@/shared/api/api-client';
import { userAvatarPlaceholder } from '@/shared/assets/user-avatar';
import { userPersonaApi } from '../api';

import { resolveActivePersona, resolvePersonaAvatarUrl } from './persona-utils';

const AVATAR_PLACEHOLDER = userAvatarPlaceholder;

type MeProfileState = {
  displayName: string;
  displayUid: string;
  avatarUrl: string;
  loading: boolean;
  applyPersona: (persona: UserPersonaItem) => void;
  refresh: () => Promise<void>;
};

function personaDisplayName(persona: UserPersonaItem): string {
  return persona.name?.trim() ?? '';
}

export const useMeProfileStore = create<MeProfileState>((set) => ({
  displayName: '',
  displayUid: '',
  avatarUrl: AVATAR_PLACEHOLDER,
  loading: false,

  applyPersona: persona => {
    set({
      displayName: personaDisplayName(persona),
      avatarUrl: resolvePersonaAvatarUrl(persona.avatar),
    });
  },

  refresh: async () => {
    if (!apiClient.getToken()) return;
    set({ loading: true });
    try {
      const [userRes, personaRes] = await Promise.all([getUserInfo({}), userPersonaApi.list()]);
      const persona = resolveActivePersona(personaRes.items ?? [], null);
      const displayUid = userRes.info.display_uid ?? '';
      const userName = userRes.info.user_name ?? '';

      set({
        displayUid,
        displayName: persona ? personaDisplayName(persona) : userName,
        avatarUrl: persona ? resolvePersonaAvatarUrl(persona.avatar) : AVATAR_PLACEHOLDER,
        loading: false,
      });
    } catch (e) {
      console.error('[me-profile-store] refresh failed:', e);
      set({ loading: false });
    }
  },
}));

export function syncMeProfileFromPersona(persona: UserPersonaItem) {
  useMeProfileStore.getState().applyPersona(persona);
}
