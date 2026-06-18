import { View, Text, Pressable, StyleSheet } from 'react-native'

import IconUnreadDot from '@/shared/assets/character/red-dot.svg'

import type { MessageConversation } from './types'
import { useLongPress } from './use-long-press'
import { Image } from 'expo-image'

type MessagesConversationRowProps = {
  item: MessageConversation
  showDivider?: boolean
  onOpenMenu?: (anchor: { x: number; y: number }) => void
  onPress?: () => void
}

export function MessagesConversationRow({
  item,
  showDivider = true,
  onOpenMenu,
  onPress,
}: MessagesConversationRowProps) {
  const longPress = useLongPress({
    onLongPress: anchor => onOpenMenu?.(anchor),
  })

  const handlePress = () => {
    if (longPress.wasLongPress()) return
    onPress?.()
  }

  return (
    <Pressable
      onPress={handlePress}
      onTouchStart={longPress.onTouchStart}
      onTouchMove={longPress.onTouchMove}
      onTouchEnd={longPress.onTouchEnd}
      style={styles.container}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.preview} numberOfLines={1}>{item.preview}</Text>
          {item.unread && <IconUnreadDot width={6} height={6} />}
        </View>
      </View>

      {showDivider && <View style={styles.divider} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  preview: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#575757',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 56,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
})
