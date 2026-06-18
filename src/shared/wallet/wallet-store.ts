import { create } from 'zustand';

import type { RechargeVerifyResp, WalletInfoResp } from '@/generated/arca_apiComponents';
import { apiClient } from '@/shared/api/api-client';

type WalletState = {
  freeTokens: number | null;
  paidTokens: number | null;
  totalTokens: number | null;
  /** 下次免费赠送的客户端估计到达时间（ms，由 server_time 校正）；无则为 null */
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
      const data = await apiClient.request<WalletInfoResp>('/wallet/info', { method: 'GET' });
      const nextGrantAt =
        data.next_grant_at > 0
          ? Date.now() + data.next_grant_at - data.server_time
          : null;
      set({
        freeTokens: data.free_tokens,
        paidTokens: data.paid_tokens,
        totalTokens: data.total_tokens,
        nextGrantAt,
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
