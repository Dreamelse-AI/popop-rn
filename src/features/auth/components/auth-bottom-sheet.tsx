import type { ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { PopopLogo } from '@/shared/assets/popop-logo'

type AuthBottomSheetProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  showLogo?: boolean
}

export function AuthBottomSheet({
  open,
  onClose,
  children,
  footer,
  showLogo = true,
}: AuthBottomSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      showCloseButton
      header={
        showLogo ? (
          <View style={styles.logoWrapper}>
            <PopopLogo width={130} height={100} />
          </View>
        ) : undefined
      }
      footer={footer}
    >
      {children}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  logoWrapper: {
    alignItems: 'center',
    paddingTop: 8,
  },
})
