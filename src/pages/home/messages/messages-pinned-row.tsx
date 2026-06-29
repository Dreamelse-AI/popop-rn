import { useCallback, useState } from 'react'
import { View, Pressable, Text, ScrollView, StyleSheet, type LayoutChangeEvent } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path } from 'react-native-svg'
import { cdnImage } from '@/shared/lib/cdn'

const IconUnreadDot = cdnImage('assets/character/red-dot.png')

import { MessagesRowMenu, type MessagesRowMenuAnchor } from './messages-row-menu'
import { useLongPress } from './use-long-press'

export type PinnedCharacterItem = {
  id: string
  name: string
  avatar: string
  preview?: string
  unread?: boolean
  /** latest_messages 中存在角色未读消息：仅此时展示预览气泡 */
  hasUnreadMessage?: boolean
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

/** 置顶预览气泡（参考 FE messages-pinned-row BUBBLE 常量） */
const BUBBLE = {
  /** 短文案最小宽度（Figma 66px） */
  minWidth: 66,
  /** 长文案最大宽度（Figma 105px） */
  maxWidth: 105,
  /** 文案左右内边距 */
  paddingX: 8,
  /** 气泡胶囊固定高度（Figma 29.5px） */
  height: 29.5,
  /** 气泡与头像重叠量（尾尖衔接头像） */
  overlapPx: 25.5,
} as const

/** Figma dialog-union.svg 尾翼路径 */
const BUBBLE_TAIL_PATH =
  'M92.049 44c-.067.158-.696 1.58-2.29 2.541-1.689 1.02-4.293.956-5.293.953-.997-.003 2.367-1.315 1.52-3.494H86.76V44H92.049Z'

export function MessagesPinnedRow({
  items,
  showBubble = true,
  onSelect,
  onUnpin,
  onEndRelation,
}: MessagesPinnedRowProps) {
  const [menuState, setMenuState] = useState<{ id: string; anchor: MessagesRowMenuAnchor } | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width)
  }, [])

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

  const contentWidth =
    items.length * PINNED_AVATAR_SIZE + (items.length - 1) * PINNED_AVATAR_GAP
  // 内容不超过容器时整体居中；超出时首个头像居中起始，可向右滚动（参考 FE updateInset）
  const sideInset =
    containerWidth > 0
      ? contentWidth <= containerWidth
        ? Math.max(PINNED_AVATAR_GAP, (containerWidth - contentWidth) / 2)
        : Math.max(PINNED_AVATAR_GAP, (containerWidth - PINNED_AVATAR_SIZE) / 2)
      : PINNED_AVATAR_GAP

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingLeft: sideInset, paddingRight: sideInset },
        ]}
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
            <Image source={{ uri: IconUnreadDot }} style={{width: 6, height: 6}} />
          </View>
        )}
      </Pressable>

      {showBubble && item.hasUnreadMessage && item.preview?.trim() ? (
        <PreviewBubble text={item.preview} placement={bubbleBelow ? 'below' : 'above'} />
      ) : null}
    </View>
  )
}

type PreviewBubbleProps = {
  text: string
  placement: 'above' | 'below'
}

function BubbleTail({ pointingDown }: { pointingDown: boolean }) {
  return (
    <Svg
      width={13}
      height={7}
      viewBox="85 43 11 7"
      style={pointingDown ? undefined : { transform: [{ scaleY: -1 }] }}
    >
      <Path fill="#ffffff" d={BUBBLE_TAIL_PATH} />
    </Svg>
  )
}

function PreviewBubble({ text, placement }: PreviewBubbleProps) {
  const isAbove = placement === 'above'
  const displayText = text.trim()
  if (!displayText) return null

  const edgeOffset = PINNED_AVATAR_SIZE - BUBBLE.overlapPx

  return (
    <View
      pointerEvents="none"
      style={[
        styles.previewBubble,
        isAbove ? { bottom: edgeOffset } : { top: edgeOffset },
      ]}
    >
      <View style={styles.bubbleShadow}>
        <View style={styles.bubbleBody}>
          <Text style={styles.previewBubbleText} numberOfLines={1}>
            {displayText}
          </Text>
        </View>
        <View style={[styles.bubbleTail, isAbove ? styles.bubbleTailBottom : styles.bubbleTailTop]}>
          <BubbleTail pointingDown={isAbove} />
        </View>
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
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  bubbleBody: {
    height: BUBBLE.height,
    minWidth: BUBBLE.minWidth,
    maxWidth: BUBBLE.maxWidth,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingHorizontal: BUBBLE.paddingX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBubbleText: {
    fontSize: 10,
    lineHeight: 22,
    fontWeight: '500',
    color: '#575757',
    textAlign: 'center',
  },
  bubbleTail: {
    position: 'absolute',
    left: '63%',
    marginLeft: -6.5,
  },
  bubbleTailBottom: {
    bottom: -6,
  },
  bubbleTailTop: {
    top: -6,
  },
})
