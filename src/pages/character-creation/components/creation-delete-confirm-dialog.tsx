import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CenterDialog } from '@/shared/ui/center-dialog';

type CreationDeleteConfirmDialogProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CreationDeleteConfirmDialog({
  open,
  loading = false,
  onClose,
  onConfirm,
}: CreationDeleteConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <CenterDialog
      open={open}
      onClose={onClose}
      closeOnBackdrop={!loading}
    >
      <View style={styles.body}>
        <Text style={styles.title}>{t('character.creation.deleteConfirmTitle')}</Text>
        <Text style={styles.message}>{t('character.creation.deleteConfirmMessage')}</Text>
      </View>
      <View style={styles.buttonRow}>
        <Pressable
          disabled={loading}
          onPress={onClose}
          style={[styles.cancelButton, loading ? styles.buttonDisabled : undefined]}
        >
          <Text style={styles.cancelButtonText}>
            {t('character.creation.deleteConfirmCancel')}
          </Text>
        </Pressable>
        <Pressable
          disabled={loading}
          onPress={onConfirm}
          style={[styles.confirmButton, loading ? styles.buttonDisabled : undefined]}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? t('character.creation.deleting') : t('character.creation.deleteConfirmAction')}
          </Text>
        </Pressable>
      </View>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
});
