import { View, Text, Pressable, StyleSheet } from 'react-native'

import { CenterDialog } from '@/shared/ui/center-dialog'

type RechargeSuccessDialogProps = {
  open: boolean
  tokenAmount: number
  onClose: () => void
}

export function RechargeSuccessDialog({
  open,
  tokenAmount,
  onClose,
}: RechargeSuccessDialogProps) {
  return (
    <CenterDialog open={open} onClose={onClose}>
      <View style={styles.panel}>
        <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>

        <View style={styles.content}>
          <Text style={styles.emoji}>🧊</Text>
          <Text style={styles.amount}>{tokenAmount}</Text>
          <Text style={styles.title}>Success</Text>
          <Text style={styles.description}>
            {tokenAmount} Cubes added to your account
          </Text>
        </View>

        <Pressable onPress={onClose} style={styles.okButton}>
          <Text style={styles.okButtonText}>OK</Text>
        </Pressable>
      </View>
    </CenterDialog>
  )
}

const styles = StyleSheet.create({
  panel: {
    width: 320,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 32,
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.4)',
  },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 80,
  },
  amount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000000',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  description: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  okButton: {
    marginTop: 24,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  okButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
