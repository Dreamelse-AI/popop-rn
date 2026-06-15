import { sessionStore } from '@/shared/session-store'
import {
  rechargeCreate,
  rechargePackages,
  rechargeVerify,
} from '@/generated/arca_api'
import type {
  RechargeCreateReq,
  RechargeCreateResp,
  RechargeVerifyReq,
  RechargeVerifyResp,
} from '@/generated/arca_apiComponents'

import { getRechargeProvider } from './iap-utils'

export { rechargePackages }

export function createRechargeOrder(
  packageId: string,
): Promise<RechargeCreateResp> {
  const req: RechargeCreateReq = {
    package_id: packageId,
    provider: getRechargeProvider(),
  }
  return rechargeCreate(req)
}

export function verifyRechargeOrder(
  req: RechargeVerifyReq,
): Promise<RechargeVerifyResp> {
  return rechargeVerify(req)
}

export const RECHARGE_PENDING_STORAGE_KEY = 'popop.recharge.pending'

export type PendingRechargeSession = {
  orderId: string
  productId: string
  tokenAmount: number
}

export function savePendingRechargeSession(session: PendingRechargeSession) {
  sessionStore.set(RECHARGE_PENDING_STORAGE_KEY, JSON.stringify(session))
}

export function loadPendingRechargeSession(): PendingRechargeSession | null {
  const raw = sessionStore.get(RECHARGE_PENDING_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PendingRechargeSession
  } catch {
    return null
  }
}

export function clearPendingRechargeSession() {
  sessionStore.remove(RECHARGE_PENDING_STORAGE_KEY)
}
