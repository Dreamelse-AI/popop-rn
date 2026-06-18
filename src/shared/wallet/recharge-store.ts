import { create } from 'zustand';

import type { RechargePackageItem } from '@/generated/arca_apiComponents';
import i18n from '@/i18n';
import { ApiError } from '@/shared/api/api-errors';

import { rechargePackages } from './recharge-api';
import type { PaidActionSource } from './run-paid-action';

export type RechargeStep = 'packages' | 'success';

type RechargeState = {
  isOpen: boolean;
  step: RechargeStep;
  source?: PaidActionSource;
  packages: RechargePackageItem[];
  packagesLoading: boolean;
  packagesError: string | null;
  selectedPackageId: string | null;
  iapPriceLabels: Record<string, string>;
  isPurchasing: boolean;
  orderError: string | null;
  successTokenAmount: number;
  open: (opts?: { source?: PaidActionSource }) => void;
  close: () => void;
  selectPackage: (packageId: string) => void;
  loadPackages: () => Promise<void>;
  setIapPriceLabels: (labels: Record<string, string>) => void;
  setSuccess: (tokenAmount: number) => void;
  setPurchaseError: (message: string | null) => void;
  setPurchasing: (isPurchasing: boolean) => void;
  resetFlow: () => void;
};

const initialFlowState = {
  step: 'packages' as RechargeStep,
  packages: [] as RechargePackageItem[],
  packagesLoading: false,
  packagesError: null as string | null,
  selectedPackageId: null as string | null,
  iapPriceLabels: {} as Record<string, string>,
  isPurchasing: false,
  orderError: null as string | null,
  successTokenAmount: 0,
};

const RECHARGE_REQUEST_TIMEOUT_MS = 15_000;

function withRechargeRequestTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Recharge request timed out'));
    }, RECHARGE_REQUEST_TIMEOUT_MS);

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function resolveBackendOrFallbackMessage(error: unknown, fallbackKey: string, fallback: string): string {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message.trim();
  }
  return i18n.t(fallbackKey, fallback);
}

export const useRechargeStore = create<RechargeState>((set, get) => ({
  isOpen: false,
  source: undefined,
  ...initialFlowState,

  open: opts => {
    if (get().isOpen) return;

    set({
      isOpen: true,
      source: opts?.source,
      ...initialFlowState,
    });

    void get().loadPackages();
  },

  close: () => {
    set({
      isOpen: false,
      source: undefined,
      ...initialFlowState,
    });
  },

  selectPackage: packageId => {
    set({ selectedPackageId: packageId, orderError: null });
  },

  loadPackages: async () => {
    set({ packagesLoading: true, packagesError: null });
    try {
      const resp = await withRechargeRequestTimeout(rechargePackages());
      const packages = [...resp.packages].sort((a, b) => a.sort_order - b.sort_order);
      set({
        packages,
        packagesLoading: false,
        selectedPackageId: packages[0]?.package_id ?? null,
      });
    } catch (error) {
      const message = resolveBackendOrFallbackMessage(
        error,
        'wallet.loadPackagesFailed',
        'Failed to load packages',
      );
      set({ packagesLoading: false, packagesError: message });
    }
  },

  setIapPriceLabels: labels => {
    set({ iapPriceLabels: labels });
  },

  setSuccess: tokenAmount => {
    set({ step: 'success', successTokenAmount: tokenAmount, isPurchasing: false });
  },

  setPurchaseError: message => {
    set({ orderError: message, isPurchasing: false });
  },

  setPurchasing: isPurchasing => {
    set({ isPurchasing });
  },

  resetFlow: () => {
    set({ ...initialFlowState });
  },
}));

export function openRecharge(opts?: { source?: PaidActionSource }) {
  useRechargeStore.getState().open(opts);
}
