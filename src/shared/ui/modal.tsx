import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { CenterDialog } from '@/shared/ui/center-dialog'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, onClose, children }: ModalProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      showCloseButton={false}
      header={
        <View style={styles.handleWrapper}>
          <View style={styles.handle} />
        </View>
      }
    >
      <View style={styles.modalContent}>{children}</View>
    </BottomSheet>
  )
}

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  content: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
}

export function Dialog({
  open,
  onClose,
  title,
  content,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
}: DialogProps) {
  return (
    <CenterDialog open={open} onClose={onClose}>
      <View style={styles.dialogBody}>
        <Text style={styles.dialogTitle}>{title}</Text>
        <View style={styles.dialogContent}>{typeof content === 'string' ? <Text style={styles.dialogContentText}>{content}</Text> : content}</View>
        <View style={styles.dialogActions}>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{cancelText}</Text>
          </Pressable>
          <Pressable style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmText}>{confirmText}</Text>
          </Pressable>
        </View>
      </View>
    </CenterDialog>
  )
}

const styles = StyleSheet.create({
  handleWrapper: {
    flexShrink: 0,
    alignItems: 'center',
    paddingTop: 16,
  },
  handle: {
    height: 4,
    width: 40,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  dialogBody: {
    padding: 24,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.9)',
    marginBottom: 8,
  },
  dialogContent: {
    marginBottom: 24,
  },
  dialogContentText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#000000',
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
})
