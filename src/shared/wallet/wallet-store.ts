import { create } from 'zustand';

import { hasAuthToken } from '@/features/auth/auth-store';
import type { RechargeVerifyResp, WalletInfoResp } from '@/generated/arca_apiComponents';
import { apiClient } from '@/shared/api/api-client';
import { registerSessionClearListener } from '@/shared/session/clear-user-session';

type WalletState = {
  freeTokens: number | null;
  paidTokens: number | null;
  totalTokens: number | null;
  nextGrantAmount: number | null;
  grantCap: number | null;
  /** 倒计时初始剩余秒数 (next_grant_at - server_time) */
  grantRemainSec: number | null;
  /** 本地记录 refresh 时的时间戳（秒），用于推算实时剩余 */
  grantFetchedAt: number | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  applyVerifyResult: (resp: RechargeVerifyResp) => void;
  reset: () => void;
};

export const useWalletStore = create<WalletState>(set => ({
  freeTokens: null,
  paidTokens: null,
  totalTokens: null,
  nextGrantAmount: null,
  grantCap: null,
  grantRemainSec: null,
  grantFetchedAt: null,
  isLoading: false,

  refresh: async () => {
    if (!hasAuthToken()) return;

    set({ isLoading: true });
    try {
      const data = await apiClient.request<WalletInfoResp>('/wallet/info', { method: 'GET' });
      const serverTime = data.server_time;
      const nextGrantAt = data.next_grant_at;
      let grantRemainSec: number | null = null;
      let grantFetchedAt: number | null = null;
      if (nextGrantAt && serverTime) {
        grantRemainSec = Math.max(0, Math.floor((nextGrantAt - serverTime) / 1000));
        grantFetchedAt = Math.floor(Date.now() / 1000);
      }
      set({
        freeTokens: data.free_tokens,
        paidTokens: data.paid_tokens,
        totalTokens: data.total_tokens,
        nextGrantAmount: data.next_grant_amount,
        grantCap: data.grant_cap,
        grantRemainSec,
        grantFetchedAt,
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
      nextGrantAmount: null,
      grantCap: null,
      grantRemainSec: null,
      grantFetchedAt: null,
      isLoading: false,
    });
  },
}));

registerSessionClearListener(() => {
  useWalletStore.getState().reset();
});

export function refreshWallet() {
  return useWalletStore.getState().refresh();
}
