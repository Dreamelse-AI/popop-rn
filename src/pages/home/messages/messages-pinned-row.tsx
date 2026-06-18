import { useCallback, useState } from 'react'
import { View, Pressable, Text, ScrollView, StyleSheet } from 'react-native'
import { Image } from 'expo-image'

import IconUnreadDot from '@/shared/assets/character/red-dot.svg'
import IconTailWhite from '@/shared/assets/dialog/dialog-pop-down-white.svg'

import { MessagesRowMenu, type MessagesRowMenuAnchor } from './messages-row-menu'
import { useLongPress } from './use-long-press'

export type PinnedCharacterItem = {
  id: string
  name: string
  avatar: string
  preview?: string
  unread?: boolean
}

type MessagesPinnedRowProps = {
  items: PinnedCharacterItem[]
  /** 是否展示预览气泡（Figma 90:23384） */
  showBubble?: boolean
  onSelect: (characterId: string) => void
  onUnpin: (characterId: string) => void | Promise<void>
  onEndRelation: (characterId: string) => void | Promise<void>
}

const PINNED_AVATAR_SIZE = 90
const PINNED_AVATAR_GAP = 16

const BUBBLE = {
  maxWidth: 120,
  textMaxWidth: 104,
  minHeight: 28,
  offsetPx: 12,
} as const

export function MessagesPinnedRow({
  items,
  showBubble = true,
  onSelect,
  onUnpin,
  onEndRelation,
}: MessagesPinnedRowProps) {
  const [menuState, setMenuState] = useState<{ id: string; anchor: MessagesRowMenuAnchor } | null>(null)

  const handleUnpin = useCallback(() => {
    if (!menuState) return
    const targetId = menuState.id
    setMenuState(null)
    void Promise.resolve(onUnpin(targetId))
  }, [menuState, onUnpin])

  const handleEndRelation = useCallback(() => {
    if (!menuState) return
    const targetId = menuState.id
    setMenuState(null)
    void Promise.resolve(onEndRelation(targetId))
  }, [menuState, onEndRelation])

  if (items.length === 0) return null

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item, index) => (
          <PinnedAvatar
            key={item.id}
            item={item}
            showBubble={showBubble}
            bubbleBelow={index % 2 === 1}
            onPress={() => onSelect(item.id)}
            onOpenMenu={anchor => setMenuState({ id: item.id, anchor })}
          />
        ))}
      </ScrollView>

      <MessagesRowMenu
        open={menuState !== null}
        anchor={menuState?.anchor ?? null}
        variant="pinned"
        onClose={() => setMenuState(null)}
        onUnpin={handleUnpin}
        onEndRelation={handleEndRelation}
      />
    </View>
  )
}

type PinnedAvatarProps = {
  item: PinnedCharacterItem
  showBubble: boolean
  bubbleBelow: boolean
  onPress: () => void
  onOpenMenu: (anchor: { x: number; y: number }) => void
}

function PinnedAvatar({ item, showBubble, bubbleBelow, onPress, onOpenMenu }: PinnedAvatarProps) {
  const longPress = useLongPress({
    onLongPress: onOpenMenu,
  })

  const handlePress = () => {
    if (longPress.wasLongPress()) return
    onPress()
  }

  return (
    <View style={styles.avatarWrapper}>
      <Pressable
        onPress={handlePress}
        onTouchStart={longPress.onTouchStart}
        onTouchMove={longPress.onTouchMove}
        onTouchEnd={longPress.onTouchEnd}
        style={styles.avatarPressable}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        {item.unread && (
          <View style={styles.unreadDot}>
            <IconUnreadDot width={6} height={6} />
          </View>
        )}
      </Pressable>

      {showBubble && (
        <PreviewBubble text={item.preview ?? ''} placement={bubbleBelow ? 'below' : 'above'} />
      )}
    </View>
  )
}

type PreviewBubbleProps = {
  text: string
  placement: 'above' | 'below'
}

function PreviewBubble({ text, placement }: PreviewBubbleProps) {
  const isAbove = placement === 'above'
  const displayText = text.trim() || '? ? ? ? ?'
  const edgeOffset = PINNED_AVATAR_SIZE - BUBBLE.offsetPx

  return (
    <View
      pointerEvents="none"
      style={[
        styles.previewBubble,
        isAbove ? { bottom: edgeOffset } : { top: edgeOffset },
      ]}
    >
      <View style={styles.bubbleShadow}>
        {!isAbove && (
          <View style={styles.bubbleTailUp}>
            <IconTailWhite width={19} height={9} />
          </View>
        )}

        <View style={styles.bubbleBody}>
          <Text style={styles.previewBubbleText} numberOfLines={1}>
            {displayText}
          </Text>
        </View>

        {isAbove && (
          <View style={styles.bubbleTailDown}>
            <IconTailWhite width={19} height={9} />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  scrollContent: {
    gap: PINNED_AVATAR_GAP,
    paddingTop: 32,
    paddingBottom: 24,
    paddingRight: 16,
    alignItems: 'flex-end',
  },
  avatarWrapper: {
    width: PINNED_AVATAR_SIZE,
    height: PINNED_AVATAR_SIZE,
    overflow: 'visible',
  },
  avatarPressable: {
    ...StyleSheet.absoluteFill,
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
  previewBubble: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bubbleShadow: {
    alignItems: 'center',
    maxWidth: BUBBLE.maxWidth,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  bubbleBody: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    minHeight: BUBBLE.minHeight,
    maxWidth: BUBBLE.maxWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBubbleText: {
    maxWidth: BUBBLE.textMaxWidth,
    fontSize: 10,
    lineHeight: 20,
    fontWeight: '500',
    color: '#575757',
    textAlign: 'center',
  },
  bubbleTailDown: {
    marginTop: -1,
    alignItems: 'center',
  },
  bubbleTailUp: {
    marginBottom: -1,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
})
