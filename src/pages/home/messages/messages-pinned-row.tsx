import { useCallback, useState } from 'react'
import { View, Pressable, Text, ScrollView, StyleSheet } from 'react-native'

import IconUnreadDot from '@/shared/assets/character/red-dot.svg'

import { MessagesRowMenu } from './messages-row-menu'
import { useLongPress } from './use-long-press'
import { Image } from 'expo-image'

export type PinnedCharacterItem = {
  id: string
  name: string
  avatar: string
  unread?: boolean
}

type MessagesPinnedRowProps = {
  items: PinnedCharacterItem[]
  onSelect: (characterId: string) => void
  onUnpin: (characterId: string) => void | Promise<void>
}

const PINNED_AVATAR_SIZE = 90

export function MessagesPinnedRow({ items, onSelect, onUnpin }: MessagesPinnedRowProps) {
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null)

  const handleUnpin = useCallback(() => {
    if (!menuConversationId) return
    const targetId = menuConversationId
    setMenuConversationId(null)
    void Promise.resolve(onUnpin(targetId))
  }, [menuConversationId, onUnpin])

  if (items.length === 0) return null

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map(item => (
          <PinnedAvatar
            key={item.id}
            item={item}
            onPress={() => onSelect(item.id)}
            onOpenMenu={() => setMenuConversationId(item.id)}
          />
        ))}
      </ScrollView>

      <MessagesRowMenu
        open={menuConversationId !== null}
        variant="pinned"
        onClose={() => setMenuConversationId(null)}
        onUnpin={handleUnpin}
      />
    </View>
  )
}

type PinnedAvatarProps = {
  item: PinnedCharacterItem
  onPress: () => void
  onOpenMenu: () => void
}

function PinnedAvatar({ item, onPress, onOpenMenu }: PinnedAvatarProps) {
  const longPress = useLongPress({
    onLongPress: () => onOpenMenu(),
  })

  const handlePress = () => {
    if (longPress.wasLongPress()) return
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      onTouchStart={longPress.onTouchStart}
      onTouchMove={longPress.onTouchMove}
      onTouchEnd={longPress.onTouchEnd}
      style={styles.avatarContainer}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
      {item.unread && (
        <View style={styles.unreadDot}>
          <IconUnreadDot width={6} height={6} />
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  scrollContent: {
    gap: 16,
    paddingVertical: 8,
  },
  avatarContainer: {
    width: PINNED_AVATAR_SIZE,
    height: PINNED_AVATAR_SIZE,
    borderRadius: PINNED_AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: PINNED_AVATAR_SIZE,
    height: PINNED_AVATAR_SIZE,
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
})
