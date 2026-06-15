import { useEffect } from 'react'

import { PaymentMethodSheet } from './payment-method-sheet'
import { RechargeSheet } from './recharge-sheet'
import { RechargeSuccessDialog } from './recharge-success-dialog'
import { useRechargeStore } from './recharge-store'
import { showGlobalToast } from './toast-store'
import { refreshWallet, useWalletStore } from './wallet-store'

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
  const pendingOrder = useRechargeStore(s => s.pendingOrder)
  const isCreatingOrder = useRechargeStore(s => s.isCreatingOrder)
  const orderError = useRechargeStore(s => s.orderError)
  const successTokenAmount = useRechargeStore(s => s.successTokenAmount)
  const close = useRechargeStore(s => s.close)
  const selectPackage = useRechargeStore(s => s.selectPackage)
  const loadPackages = useRechargeStore(s => s.loadPackages)
  const beginPayment = useRechargeStore(s => s.beginPayment)
  const setSuccess = useRechargeStore(s => s.setSuccess)

  const selectedTokenAmount = getSelectedTokenAmount(packages, selectedPackageId)

  useEffect(() => {
    if (!isOpen) return
    void refreshWallet()
  }, [isOpen])

  const handleContinue = async () => {
    await beginPayment()
  }

  const handlePaymentError = (message: string) => {
    showGlobalToast(message)
  }

  const handlePaymentSuccess = (tokenAmount: number) => {
    setSuccess(tokenAmount)
  }

  const handleSuccessClose = () => {
    close()
  }

  const showPackageSheet = isOpen && step === 'packages'
  const showPaymentSheet = isOpen && step === 'payment' && !!pendingOrder
  const showSuccessDialog = isOpen && step === 'success'

  return (
    <>
      <RechargeSheet
        open={showPackageSheet}
        packages={packages}
        packagesLoading={packagesLoading}
        packagesError={packagesError}
        selectedPackageId={selectedPackageId}
        isCreatingOrder={isCreatingOrder}
        orderError={orderError}
        onClose={close}
        onSelectPackage={selectPackage}
        onRetryPackages={() => void loadPackages()}
        onContinue={() => void handleContinue()}
      />

      {showPaymentSheet && pendingOrder ? (
        <PaymentMethodSheet
          open={showPaymentSheet}
          order={pendingOrder}
          tokenAmount={selectedTokenAmount}
          onClose={close}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      ) : null}

      <RechargeSuccessDialog
        open={showSuccessDialog}
        tokenAmount={successTokenAmount}
        onClose={handleSuccessClose}
      />
    </>
  )
}
