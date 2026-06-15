import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { CenterDialog } from '@/shared/ui/center-dialog'

type ChatRollbackConfirmDialogProps = {
  open: boolean
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ChatRollbackConfirmDialog({
  open,
  loading = false,
  onClose,
  onConfirm,
}: ChatRollbackConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <CenterDialog open={open} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('chatMessageMenu.rollbackConfirmTitle')}</Text>
        <Text style={styles.message}>{t('chatMessageMenu.rollbackConfirmMessage')}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          disabled={loading}
          onPress={onClose}
          style={[styles.cancelButton, loading && styles.disabled]}
        >
          <Text style={styles.cancelText}>{t('chatMessageMenu.cancel')}</Text>
        </Pressable>
        <Pressable
          disabled={loading}
          onPress={onConfirm}
          style={[styles.confirmButton, loading && styles.disabled]}
        >
          <Text style={styles.confirmText}>
            {loading ? t('chatMessageMenu.rollbacking') : t('chatMessageMenu.confirm')}
          </Text>
        </Pressable>
      </View>
    </CenterDialog>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  disabled: {
    opacity: 0.5,
  },
})
