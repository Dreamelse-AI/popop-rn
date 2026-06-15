import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import IconPin from '@/shared/assets/character/dialog-pin.svg'
import IconEndRelation from '@/shared/assets/character/icon-feedback.svg'

type MessagesRowMenuProps = {
  open: boolean
  onClose: () => void
  variant?: 'conversation' | 'pinned'
  onPin?: () => void
  onUnpin?: () => void
  onEndRelation?: () => void
}

export function MessagesRowMenu({
  open,
  onClose,
  variant = 'conversation',
  onPin,
  onUnpin,
  onEndRelation,
}: MessagesRowMenuProps) {
  const { t } = useTranslation()
  if (!open) return null

  const isPinnedVariant = variant === 'pinned'

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          {isPinnedVariant ? (
            <Pressable style={styles.menuItem} onPress={() => { onUnpin?.(); onClose() }}>
              <IconPin width={24} height={24} />
              <Text style={styles.menuItemText}>{t('messageMenu.unpin')}</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.menuItem} onPress={() => { onPin?.(); onClose() }}>
                <IconPin width={24} height={24} />
                <Text style={styles.menuItemText}>{t('messageMenu.pin')}</Text>
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.menuItem} onPress={() => { onEndRelation?.(); onClose() }}>
                <IconEndRelation width={24} height={24} />
                <Text style={styles.menuItemTextDanger}>{t('messageMenu.endRelation')}</Text>
              </Pressable>
            </>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menu: {
    width: 160,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingVertical: 6,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  menuItemTextDanger: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#ff3c00',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 4,
  },
})
