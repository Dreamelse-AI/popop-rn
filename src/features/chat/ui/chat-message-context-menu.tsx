import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

type ChatMessageContextMenuProps = {
  open: boolean
  canCopy: boolean
  canRollback: boolean
  onClose: () => void
  onCopy: () => void
  onRollback: () => void
}

export function ChatMessageContextMenu({
  open,
  canCopy,
  canRollback,
  onClose,
  onCopy,
  onRollback,
}: ChatMessageContextMenuProps) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          {canRollback && (
            <Pressable style={styles.menuItem} onPress={onRollback}>
              <Text style={styles.menuItemText}>{t('chatMessageMenu.rollback')}</Text>
            </Pressable>
          )}
          {canRollback && canCopy && <View style={styles.divider} />}
          {canCopy && (
            <Pressable style={styles.menuItem} onPress={onCopy}>
              <Text style={styles.menuItemText}>{t('chatMessageMenu.copy')}</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menu: {
    width: 176,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  menuItem: {
    height: 40,
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 6,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 4,
  },
})
