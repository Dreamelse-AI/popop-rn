import { create } from 'zustand';

import type { RechargeCreateResp, RechargePackageItem } from '@/generated/arca_apiComponents';

import { createStripeRechargeOrder, rechargePackages } from './recharge-api';
import type { PaidActionSource } from './run-paid-action';

export type RechargeStep = 'packages' | 'payment' | 'success';

type RechargeState = {
  isOpen: boolean;
  step: RechargeStep;
  source?: PaidActionSource;
  packages: RechargePackageItem[];
  packagesLoading: boolean;
  packagesError: string | null;
  selectedPackageId: string | null;
  pendingOrder: RechargeCreateResp | null;
  isCreatingOrder: boolean;
  orderError: string | null;
  successTokenAmount: number;
  open: (opts?: { source?: PaidActionSource }) => void;
  close: () => void;
  setStep: (step: RechargeStep) => void;
  selectPackage: (packageId: string) => void;
  loadPackages: () => Promise<void>;
  beginPayment: () => Promise<boolean>;
  setSuccess: (tokenAmount: number) => void;
  resetFlow: () => void;
};

const initialFlowState = {
  step: 'packages' as RechargeStep,
  packages: [] as RechargePackageItem[],
  packagesLoading: false,
  packagesError: null as string | null,
  selectedPackageId: null as string | null,
  pendingOrder: null as RechargeCreateResp | null,
  isCreatingOrder: false,
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

  setStep: step => {
    set({ step });
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

  beginPayment: async () => {
    const packageId = get().selectedPackageId;
    if (!packageId) return false;

    set({ isCreatingOrder: true, orderError: null });
    try {
      const order = await createStripeRechargeOrder(packageId);
      if (!order.client_secret) {
        throw new Error('Missing Stripe client secret');
      }
      set({
        pendingOrder: order,
        isCreatingOrder: false,
        step: 'payment',
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      set({ isCreatingOrder: false, orderError: message });
      return false;
    }
  },

  setSuccess: tokenAmount => {
    set({ step: 'success', successTokenAmount: tokenAmount });
  },

  resetFlow: () => {
    set({ ...initialFlowState });
  },
}));

export function openRecharge(opts?: { source?: PaidActionSource }) {
  useRechargeStore.getState().open(opts);
}
