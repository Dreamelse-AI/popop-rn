import { useState } from 'react'
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { useStripe } from '@stripe/stripe-react-native'

import type { RechargeCreateResp } from '@/generated/arca_apiComponents'
import { BottomSheet } from '@/shared/ui/bottom-sheet'

import {
  clearPendingRechargeSession,
  savePendingRechargeSession,
  verifyRechargeOrder,
} from './recharge-api'
import { stripePublishableKey } from './stripe-provider'
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
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
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
      const clientSecret = order.client_secret?.trim()
      if (!clientSecret) {
        clearPendingRechargeSession()
        onError('Missing Stripe client secret')
        return
      }

      if (!stripePublishableKey) {
        clearPendingRechargeSession()
        onError('Stripe publishable key is not configured')
        return
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Popop',
      })

      if (initError) {
        clearPendingRechargeSession()
        onError(initError.message)
        return
      }

      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        clearPendingRechargeSession()
        if (presentError.code !== 'Canceled') {
          onError(presentError.message)
        }
        return
      }

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
            {stripePublishableKey
              ? 'Tap Pay to open Stripe Payment Sheet'
              : 'Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments'}
          </Text>
        </View>

        <Pressable
          onPress={() => void handlePay()}
          disabled={paying || !stripePublishableKey}
          style={[styles.payButton, (paying || !stripePublishableKey) && styles.payButtonDisabled]}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay</Text>
          )}
        </Pressable>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  paymentArea: {
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholder: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center',
  },
  payButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
})
