import { Platform } from 'react-native'
import type { Purchase, PurchaseAndroid } from 'expo-iap'

import type { RechargePackageItem } from '@/generated/arca_apiComponents'

export const APPLE_IAP_PROVIDER = 'apple_iap' as const
export const GOOGLE_PLAY_PROVIDER = 'google_play' as const

export type RechargeIapProvider = typeof APPLE_IAP_PROVIDER | typeof GOOGLE_PLAY_PROVIDER

export function getRechargeProvider(): RechargeIapProvider {
  return Platform.OS === 'ios' ? APPLE_IAP_PROVIDER : GOOGLE_PLAY_PROVIDER
}

export function getProviderProductId(pkg: RechargePackageItem): string | null {
  const productId = pkg.provider_products?.[getRechargeProvider()]?.trim()
  return productId || null
}

export function collectProviderProductIds(packages: RechargePackageItem[]): string[] {
  const provider = getRechargeProvider()
  const ids = packages
    .map(pkg => pkg.provider_products?.[provider]?.trim())
    .filter((id): id is string => Boolean(id))
  return [...new Set(ids)]
}

export function buildVerifyPayload(purchase: Purchase): {
  receipt: string
  signature?: string
} {
  if (Platform.OS === 'android') {
    const androidPurchase = purchase as PurchaseAndroid
    const receipt = androidPurchase.dataAndroid?.trim()
    const signature = androidPurchase.signatureAndroid?.trim()
    if (!receipt) {
      throw new Error('Missing Google Play purchase data')
    }
    return { receipt, signature: signature || undefined }
  }

  const receipt = purchase.purchaseToken?.trim()
  if (!receipt) {
    throw new Error('Missing Apple purchase receipt')
  }
  return { receipt }
}
