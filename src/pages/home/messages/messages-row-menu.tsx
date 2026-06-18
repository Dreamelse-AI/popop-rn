import { useMemo } from 'react'
import { View, Text, Pressable, Modal, StyleSheet, useWindowDimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import IconPin from '@/shared/assets/character/dialog-pin.svg'
import IconDeleteCharacter from '@/shared/assets/character/icon-delete-character.svg'

export type MessagesRowMenuAnchor = {
  x: number
  y: number
}

type MessagesRowMenuProps = {
  open: boolean
  onClose: () => void
  variant?: 'conversation' | 'pinned'
  anchor?: MessagesRowMenuAnchor | null
  onPin?: () => void
  onUnpin?: () => void
  onEndRelation?: () => void
}

const MENU_WIDTH = 160
const MENU_ITEM_WIDTH = 128
const MENU_ESTIMATED_HEIGHT = 113
const EDGE_MARGIN = 16

function computeMenuPosition(
  anchor: MessagesRowMenuAnchor,
  window: { width: number; height: number },
  insets: { top: number; bottom: number },
) {
  let left = anchor.x - MENU_WIDTH / 2
  let top = anchor.y - MENU_ESTIMATED_HEIGHT / 2

  const minLeft = EDGE_MARGIN
  const maxLeft = window.width - MENU_WIDTH - EDGE_MARGIN
  const minTop = insets.top + EDGE_MARGIN
  const maxTop = window.height - MENU_ESTIMATED_HEIGHT - insets.bottom - EDGE_MARGIN

  return {
    left: Math.max(minLeft, Math.min(left, maxLeft)),
    top: Math.max(minTop, Math.min(top, maxTop)),
  }
}

export function MessagesRowMenu({
  open,
  onClose,
  variant = 'conversation',
  anchor,
  onPin,
  onUnpin,
  onEndRelation,
}: MessagesRowMenuProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const window = useWindowDimensions()

  const menuPosition = useMemo(() => {
    if (!anchor) {
      return {
        left: (window.width - MENU_WIDTH) / 2,
        top: (window.height - MENU_ESTIMATED_HEIGHT) / 2,
      }
    }
    return computeMenuPosition(anchor, window, insets)
  }, [anchor, insets, window])

  if (!open) return null

  const isPinnedVariant = variant === 'pinned'

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.menu, { left: menuPosition.left, top: menuPosition.top }]}
          onPress={event => event.stopPropagation()}
        >
          {isPinnedVariant ? (
            <>
              <Pressable style={styles.menuItem} onPress={() => { onUnpin?.(); onClose() }}>
                <IconPin width={24} height={24} />
                <Text style={styles.menuItemText}>{t('messageMenu.unpin')}</Text>
              </Pressable>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
              </View>
              <Pressable style={styles.menuItem} onPress={() => { onEndRelation?.(); onClose() }}>
                <IconDeleteCharacter width={24} height={24} />
                <Text style={styles.menuItemTextDanger}>{t('messageMenu.endRelation')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.menuItem} onPress={() => { onPin?.(); onClose() }}>
                <IconPin width={24} height={24} />
                <Text style={styles.menuItemText}>{t('messageMenu.pin')}</Text>
              </Pressable>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
              </View>
              <Pressable style={styles.menuItem} onPress={() => { onEndRelation?.(); onClose() }}>
                <IconDeleteCharacter width={24} height={24} />
                <Text style={styles.menuItemTextDanger}>{t('messageMenu.endRelation')}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: MENU_ITEM_WIDTH,
    height: 40,
    paddingVertical: 6,
    borderRadius: 12,
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
  dividerContainer: {
    width: MENU_ITEM_WIDTH,
    height: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
})
