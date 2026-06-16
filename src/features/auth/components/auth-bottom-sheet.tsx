import type { ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { PopopLogo } from '@/shared/assets/popop-logo'

type AuthBottomSheetProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  header?: ReactNode
  showLogo?: boolean
}

export function AuthBottomSheet({
  open,
  onClose,
  children,
  footer,
  header,
  showLogo = true,
}: AuthBottomSheetProps) {
  const sheetHeader =
    header ??
    (showLogo ? (
      <View style={styles.logoWrapper}>
        <PopopLogo width={130} height={100} />
      </View>
    ) : undefined)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={sheetHeader}
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
