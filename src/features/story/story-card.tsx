import { View, Text, StyleSheet } from 'react-native'

import type { StoryItem } from './story-types'
import { Image } from 'expo-image'

type StoryCardProps = {
  story: StoryItem
  isActive?: boolean
}

export function StoryCard({ story, isActive }: StoryCardProps) {
  return (
    <View style={[styles.container, isActive ? styles.active : styles.inactive]}>
      {story.type === 'image' && story.images?.[0] && (
        <Image source={{ uri: story.images[0] }} style={styles.image} />
      )}
      {story.type === 'text' && (
        <View style={styles.textContainer}>
          <Text style={styles.text}>{story.text}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 360,
    height: 480,
    borderRadius: 30,
    overflow: 'hidden',
  },
  active: {
    transform: [{ scale: 1 }],
    opacity: 1,
  },
  inactive: {
    transform: [{ scale: 0.9 }],
    opacity: 0.6,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#1a1a2e',
  },
  text: {
    fontSize: 18,
    lineHeight: 29,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
})
