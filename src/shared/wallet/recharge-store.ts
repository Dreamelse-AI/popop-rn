import { create } from 'zustand';

import type { RechargePackageItem } from '@/generated/arca_apiComponents';

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
      const resp = await rechargePackages();
      const packages = [...resp.packages].sort((a, b) => a.sort_order - b.sort_order);
      set({
        packages,
        packagesLoading: false,
        selectedPackageId: packages[0]?.package_id ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load packages';
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
