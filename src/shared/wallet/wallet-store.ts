import { create } from 'zustand';

import type { RechargeVerifyResp } from '@/generated/arca_apiComponents';
import { walletInfo } from '@/generated/arca_api';

type WalletState = {
  freeTokens: number | null;
  paidTokens: number | null;
  totalTokens: number | null;
  /** 下次免费赠送的 UTC 秒级时间戳；无则为 null */
  nextGrantAt: number | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  applyVerifyResult: (resp: RechargeVerifyResp) => void;
  reset: () => void;
};

export const useWalletStore = create<WalletState>(set => ({
  freeTokens: null,
  paidTokens: null,
  totalTokens: null,
  nextGrantAt: null,
  isLoading: false,

  refresh: async () => {
    set({ isLoading: true });
    try {
      const data = await walletInfo();
      set({
        freeTokens: data.free_tokens,
        paidTokens: data.paid_tokens,
        totalTokens: data.total_tokens,
        nextGrantAt: data.next_grant_at ?? null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  applyVerifyResult: (resp) => {
    set({
      freeTokens: resp.free_tokens,
      paidTokens: resp.paid_tokens,
      totalTokens: resp.free_tokens + resp.paid_tokens,
    });
  },

  reset: () => {
    set({
      freeTokens: null,
      paidTokens: null,
      totalTokens: null,
      nextGrantAt: null,
      isLoading: false,
    });
  },
}));

export function refreshWallet() {
  return useWalletStore.getState().refresh();
}
