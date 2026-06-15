import { View, Text, Pressable, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import type { StoryCharacter, StoryItem } from './story-types'
import { Image } from 'expo-image'

type StoryHeaderProps = {
  character: StoryCharacter
  story: StoryItem
  onClose: () => void
}

export function StoryHeader({ character, story, onClose }: StoryHeaderProps) {
  const timeAgo = getTimeAgo(story.createdAt)

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path d="M15 5L5 15M5 5l10 10" stroke="white" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Pressable style={styles.shareButton} accessibilityLabel="Share">
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path d="M10 3v10M10 3l4 4M10 3L6 7M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.characterInfo}>
          <Image source={{ uri: character.avatar }} style={styles.avatar} />
          <Text style={styles.characterName}>{character.name}</Text>
        </View>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>

      {story.text ? (
        <Text style={styles.storyText} numberOfLines={2}>{story.text}</Text>
      ) : null}
    </View>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  characterName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  storyText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.8)',
  },
})
