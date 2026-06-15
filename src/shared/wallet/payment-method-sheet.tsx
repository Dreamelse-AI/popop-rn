import { useState } from 'react'
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'

import type { RechargeCreateResp } from '@/generated/arca_apiComponents'
import { BottomSheet } from '@/shared/ui/bottom-sheet'

import {
  clearPendingRechargeSession,
  savePendingRechargeSession,
  verifyRechargeOrder,
} from './recharge-api'
import { useWalletStore } from './wallet-store'

type PaymentMethodSheetProps = {
  open: boolean
  order: RechargeCreateResp
  tokenAmount: number
  onClose: () => void
  onSuccess: (tokenAmount: number) => void
  onError: (message: string) => void
}

export function PaymentMethodSheet({
  open,
  order,
  tokenAmount,
  onClose,
  onSuccess,
  onError,
}: PaymentMethodSheetProps) {
  const applyVerifyResult = useWalletStore(s => s.applyVerifyResult)
  const [paying, setPaying] = useState(false)

  const handlePay = async () => {
    if (paying) return
    setPaying(true)

    savePendingRechargeSession({
      orderId: order.order_id,
      paymentIntentId: order.payment_intent_id,
      tokenAmount,
    })

    try {
      // TODO: integrate @stripe/stripe-react-native confirmPayment
      // For now, call verify directly (assumes payment succeeds via native Stripe sheet)
      const receipt = order.payment_intent_id
      if (!receipt) {
        clearPendingRechargeSession()
        onError('Missing payment intent')
        return
      }

      const resp = await verifyRechargeOrder({ order_id: order.order_id, receipt })
      applyVerifyResult(resp)
      clearPendingRechargeSession()
      onSuccess(tokenAmount)
    } catch (error) {
      clearPendingRechargeSession()
      onError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Payment Method</Text>

        <View style={styles.paymentArea}>
          <Text style={styles.placeholder}>
            Stripe payment sheet will appear here
          </Text>
        </View>

        <Pressable
          onPress={() => void handlePay()}
          disabled={paying}
          style={[styles.payButton, paying && styles.payButtonDisabled]}
        >
          {paying ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>Pay Now</Text>
          )}
        </Pressable>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  paymentArea: {
    minHeight: 120,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  placeholder: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  payButton: {
    marginTop: 16,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
