import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

import { useStoryReadStore } from '@/features/story/story-store'

import { isHeadlineCharacterUnread } from '../headline-read'
import type { StoryHeadline } from '../types'
import { Image } from 'expo-image'
import { cdnImage } from '@/shared/lib/cdn'

const IconUnreadRing = cdnImage('assets/feed/icon/Ellipse_111367.png')

type StoryAvatarProps = {
  item: StoryHeadline
  onClick: () => void
}

export function StoryAvatar({ item, onClick }: StoryAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const readStoryIds = useStoryReadStore(s => s.readStoryIds)
  const fullyReadCharacterIds = useStoryReadStore(s => s.fullyReadCharacterIds)
  const showUnreadRing = isHeadlineCharacterUnread(item, {
    isStoryRead: (storyId: string) => readStoryIds.has(storyId),
    isCharacterFullyRead: (characterId: string) =>
      fullyReadCharacterIds.has(characterId),
  })
  const showFallback = !item.characterAvatarUrl || imageFailed
  const initial = item.characterName.charAt(0) || '?'

  return (
    <Pressable
      onPress={onClick}
      style={styles.container}
      accessibilityLabel={`查看 ${item.characterName} 的限时动态`}
      accessibilityRole="button"
    >
      <View style={styles.avatarCircle}>
        {showFallback ? (
          <Text style={styles.fallbackText}>{initial}</Text>
        ) : (
          <Image
            source={{ uri: item.characterAvatarUrl! }}
            style={styles.avatarImage}
            contentFit="cover"
            onError={() => setImageFailed(true)}
          />
        )}
      </View>

      {showUnreadRing && (
        <View pointerEvents="none" style={styles.unreadRingWrapper}>
          <Image source={{ uri: IconUnreadRing }} style={{width: 68, height: 68}} />
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8e8e8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
  },
  avatarImage: {
    width: 60,
    height: 60,
  },
  unreadRingWrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
