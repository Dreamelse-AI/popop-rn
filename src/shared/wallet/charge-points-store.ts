import { create } from 'zustand';

import { hasAuthToken } from '@/features/auth/auth-store';
import { walletChargePoints } from '@/generated/arca_api';
import type { ChargePointItem } from '@/generated/arca_apiComponents';
import { registerSessionClearListener } from '@/shared/session/clear-user-session';

export type ChargePointScene =
  | 'anonymous_chat'
  | 'chat_with_character'
  | 'gen_appearance'
  | 'gen_landing_page'
  | 'random_match'
  | 'story_comment';

type ChargePointsState = {
  chargePoints: ChargePointItem[];
  isLoading: boolean;
  hasLoaded: boolean;
  refresh: () => Promise<void>;
  reset: () => void;
};

export const useChargePointsStore = create<ChargePointsState>(set => ({
  chargePoints: [],
  isLoading: false,
  hasLoaded: false,

  refresh: async () => {
    if (!hasAuthToken()) {
      set({ hasLoaded: true });
      return;
    }

    set({ isLoading: true });
    try {
      const data = await walletChargePoints();
      set({ chargePoints: data.charge_points ?? [], isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, hasLoaded: true });
    }
  },

  reset: () => {
    set({ chargePoints: [], isLoading: false, hasLoaded: false });
  },
}));

registerSessionClearListener(() => {
  useChargePointsStore.getState().reset();
});

export function refreshChargePoints() {
  return useChargePointsStore.getState().refresh();
}

export function getChargePointPrice(scene: ChargePointScene | string): number | null {
  const item = useChargePointsStore
    .getState()
    .chargePoints.find(point => point.scene === scene);
  return item?.price ?? null;
}

export function useChargePointPrice(scene: ChargePointScene | string): number | null {
  return useChargePointsStore(
    state => state.chargePoints.find(point => point.scene === scene)?.price ?? null,
  );
}

export function useChargePointDisplay(scene: ChargePointScene | string): {
  price: number | null;
  isLoading: boolean;
  label: string;
} {
  const price = useChargePointPrice(scene);
  const isLoading = useChargePointsStore(state => state.isLoading);
  const hasLoaded = useChargePointsStore(state => state.hasLoaded);

  if (price != null) {
    return { price, isLoading: false, label: String(price) };
  }
  if (!hasLoaded || isLoading) {
    return { price: null, isLoading: true, label: '...' };
  }
  return { price: null, isLoading: false, label: '—' };
}
