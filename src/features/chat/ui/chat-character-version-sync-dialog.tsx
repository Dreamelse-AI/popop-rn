import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { CenterDialog } from '@/shared/ui/center-dialog'

type ChatCharacterVersionSyncDialogProps = {
  open: boolean
  loading?: boolean
  onUpdate: () => void
  onDismiss: () => void
  onClose?: () => void
}

export function ChatCharacterVersionSyncDialog({
  open,
  loading = false,
  onUpdate,
  onDismiss,
  onClose,
}: ChatCharacterVersionSyncDialogProps) {
  const { t } = useTranslation()

  return (
    <CenterDialog open={open} onClose={onClose ?? onDismiss}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('chatCharacterVersionSync.title')}</Text>
        <Text style={styles.message}>{t('chatCharacterVersionSync.message')}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          disabled={loading}
          onPress={onDismiss}
          style={[styles.dismissButton, loading && styles.disabled]}
        >
          <Text style={styles.dismissText}>{t('chatCharacterVersionSync.dismiss')}</Text>
        </Pressable>
        <Pressable
          disabled={loading}
          onPress={onUpdate}
          style={[styles.updateButton, loading && styles.disabled]}
        >
          <Text style={styles.updateText}>
            {loading ? t('chatCharacterVersionSync.updating') : t('chatCharacterVersionSync.update')}
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
  dismissButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  updateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c45c26',
  },
  disabled: {
    opacity: 0.5,
  },
})
