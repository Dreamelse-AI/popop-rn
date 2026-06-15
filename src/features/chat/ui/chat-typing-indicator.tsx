import { View, Text, StyleSheet } from 'react-native'

import type { BubbleStyleTokens } from '../lib/chat-atmosphere-presets'
import { getBubbleStyleTokens } from '../lib/chat-atmosphere-presets'
import { Image } from 'expo-image'

type ChatTypingIndicatorProps = {
  avatar: string
  bubbleStyle?: BubbleStyleTokens
}

export function ChatTypingIndicator({
  avatar,
  bubbleStyle = getBubbleStyleTokens('classic'),
}: ChatTypingIndicatorProps) {
  const { received } = bubbleStyle

  return (
    <View style={styles.container}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={[styles.bubble, { backgroundColor: received.bgColor }]}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  bubble: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
})
