import { useEffect, useRef, useState } from 'react'
import { ErrorCode, useIAP } from 'expo-iap'

import { HistoryPage } from '@/pages/home/history-page'

import {
  clearPendingRechargeSession,
  createRechargeOrder,
  savePendingRechargeSession,
  verifyRechargeOrder,
} from './recharge-api'
import { buildVerifyPayload, collectProviderProductIds, getProviderProductId } from './iap-utils'
import { RechargeSheet } from './recharge-sheet'
import { RechargeSuccessDialog } from './recharge-success-dialog'
import { useRechargeStore } from './recharge-store'
import { showGlobalToast } from './toast-store'
import { refreshWallet, useWalletStore } from './wallet-store'

type PendingPurchaseContext = {
  orderId: string
  productId: string
  tokenAmount: number
}

function getSelectedTokenAmount(
  packages: ReturnType<typeof useRechargeStore.getState>['packages'],
  packageId: string | null,
): number {
  const pkg = packages.find(item => item.package_id === packageId)
  if (!pkg) return 0
  return pkg.tokens + pkg.bonus_tokens
}

export function RechargeHost() {
  const isOpen = useRechargeStore(s => s.isOpen)
  const step = useRechargeStore(s => s.step)
  const packages = useRechargeStore(s => s.packages)
  const packagesLoading = useRechargeStore(s => s.packagesLoading)
  const packagesError = useRechargeStore(s => s.packagesError)
  const selectedPackageId = useRechargeStore(s => s.selectedPackageId)
  const iapPriceLabels = useRechargeStore(s => s.iapPriceLabels)
  const isPurchasing = useRechargeStore(s => s.isPurchasing)
  const orderError = useRechargeStore(s => s.orderError)
  const successTokenAmount = useRechargeStore(s => s.successTokenAmount)
  const source = useRechargeStore(s => s.source)
  const close = useRechargeStore(s => s.close)
  const selectPackage = useRechargeStore(s => s.selectPackage)
  const loadPackages = useRechargeStore(s => s.loadPackages)
  const setSuccess = useRechargeStore(s => s.setSuccess)
  const setPurchaseError = useRechargeStore(s => s.setPurchaseError)
  const setPurchasing = useRechargeStore(s => s.setPurchasing)
  const setIapPriceLabels = useRechargeStore(s => s.setIapPriceLabels)

  const applyVerifyResult = useWalletStore(s => s.applyVerifyResult)
  const pendingPurchaseRef = useRef<PendingPurchaseContext | null>(null)
  const purchaseRequestRef = useRef<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const selectedTokenAmount = getSelectedTokenAmount(packages, selectedPackageId)

  const { connected, products, fetchProducts, requestPurchase, finishTransaction } = useIAP({
    onPurchaseSuccess: async purchase => {
      const pending = pendingPurchaseRef.current
      if (!pending) {
        await finishTransaction({ purchase, isConsumable: true })
        return
      }

      try {
        const { receipt, signature } = buildVerifyPayload(purchase)
        const resp = await verifyRechargeOrder({
          order_id: pending.orderId,
          receipt,
          signature,
        })
        applyVerifyResult(resp)
        void refreshWallet()
        clearPendingRechargeSession()
        setSuccess(pending.tokenAmount)
      } catch (error) {
        clearPendingRechargeSession()
        const message = error instanceof Error ? error.message : 'Payment verification failed'
        setPurchaseError(message)
        showGlobalToast(message)
      } finally {
        pendingPurchaseRef.current = null
        purchaseRequestRef.current = null
        setPurchasing(false)
        await finishTransaction({ purchase, isConsumable: true })
      }
    },
    onPurchaseError: error => {
      pendingPurchaseRef.current = null
      purchaseRequestRef.current = null
      clearPendingRechargeSession()
      setPurchasing(false)

      if (error.code === ErrorCode.UserCancelled) {
        return
      }

      const message = error.message || 'Purchase failed'
      setPurchaseError(message)
      showGlobalToast(message)
    },
  })

  useEffect(() => {
    if (!isOpen) return
    void refreshWallet()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) setShowHistory(false)
  }, [isOpen])

  useEffect(() => {
    if (!connected || packages.length === 0) return

    const skus = collectProviderProductIds(packages)
    if (skus.length === 0) return

    void fetchProducts({ skus, type: 'in-app' })
  }, [connected, fetchProducts, packages])

  useEffect(() => {
    if (products.length === 0) return

    const labels = Object.fromEntries(products.map(product => [product.id, product.displayPrice]))
    setIapPriceLabels(labels)
  }, [products, setIapPriceLabels])

  const handleContinue = async () => {
    const packageId = selectedPackageId
    if (!packageId || isPurchasing) return

    const selectedPackage = packages.find(pkg => pkg.package_id === packageId)
    if (!selectedPackage) {
      setPurchaseError('Package not found')
      return
    }

    const productId = getProviderProductId(selectedPackage)
    if (!productId) {
      setPurchaseError('Product is not configured for this platform')
      return
    }

    if (!connected) {
      setPurchaseError('Store is not available. Use a development build on a real device.')
      return
    }

    setPurchasing(true)
    setPurchaseError(null)

    try {
      const order = await createRechargeOrder(packageId)
      const storeProductId = order.product_id?.trim()
      if (!storeProductId) {
        throw new Error('Missing store product id')
      }

      if (purchaseRequestRef.current === order.order_id) {
        return
      }

      purchaseRequestRef.current = order.order_id
      pendingPurchaseRef.current = {
        orderId: order.order_id,
        productId: storeProductId,
        tokenAmount: selectedTokenAmount,
      }

      savePendingRechargeSession({
        orderId: order.order_id,
        productId: storeProductId,
        tokenAmount: selectedTokenAmount,
      })

      await requestPurchase({
        request: {
          apple: { sku: storeProductId },
          google: { skus: [storeProductId] },
        },
        type: 'in-app',
      })
    } catch (error) {
      pendingPurchaseRef.current = null
      purchaseRequestRef.current = null
      clearPendingRechargeSession()
      setPurchasing(false)

      const message = error instanceof Error ? error.message : 'Failed to start purchase'
      setPurchaseError(message)
      showGlobalToast(message)
    }
  }

  const handleSuccessClose = () => {
    close()
  }

  const showPackageSheet = isOpen && step === 'packages'
  const showSuccessDialog = isOpen && step === 'success'

  return (
    <>
      <RechargeSheet
        open={showPackageSheet}
        presentation={source === 'me_page' ? 'fullscreen' : 'sheet'}
        packages={packages}
        packagesLoading={packagesLoading}
        packagesError={packagesError}
        selectedPackageId={selectedPackageId}
        iapPriceLabels={iapPriceLabels}
        isPurchasing={isPurchasing}
        orderError={orderError}
        onClose={close}
        onSelectPackage={selectPackage}
        onRetryPackages={() => void loadPackages()}
        onContinue={() => void handleContinue()}
        onOpenHistory={() => setShowHistory(true)}
      />

      {showHistory ? <HistoryPage onBack={() => setShowHistory(false)} /> : null}

      <RechargeSuccessDialog
        open={showSuccessDialog}
        tokenAmount={successTokenAmount}
        onClose={handleSuccessClose}
      />
    </>
  )
}
