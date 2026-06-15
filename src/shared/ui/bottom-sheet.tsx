import { type ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  header?: ReactNode
  showCloseButton?: boolean
  closeIcon?: ReactNode
}

function DefaultCloseIcon() {
  return (
    <View style={defaultCloseStyles.circle}>
      <Text style={defaultCloseStyles.x}>✕</Text>
    </View>
  )
}

const defaultCloseStyles = StyleSheet.create({
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  x: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
    marginTop: -1,
  },
})

export function BottomSheet({
  open,
  onClose,
  children,
  footer,
  header,
  showCloseButton = true,
  closeIcon,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets()

  if (!open) return null

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
          <View style={styles.handle} />

          {showCloseButton && (
            <Pressable style={styles.closeButton} onPress={onClose} accessibilityLabel="Close">
              {closeIcon ?? <DefaultCloseIcon />}
            </Pressable>
          )}

          {header}

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f7f7f7',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginTop: 12,
    marginBottom: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 20,
  },
  scrollArea: {
    flexShrink: 1,
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
