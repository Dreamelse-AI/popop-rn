import { View, Text, StyleSheet } from 'react-native'

import { cdnImage } from '@/shared/lib/cdn'
const SceneBannerBg = { uri: cdnImage('assets/character/character-banner.png') }
const TagPillBg = cdnImage('assets/character/character-rectangle.png')
const IconLocation = cdnImage('assets/character/location.png')
const IconActiveDot = cdnImage('assets/character/white-dot.png')

import type { MessageScene } from './types'
import { Image } from 'expo-image'

type MessagesSceneBannerProps = {
  scene: MessageScene
}

export function MessagesSceneBanner({ scene }: MessagesSceneBannerProps) {
  return (
    <View style={styles.container}>
      <Image source={SceneBannerBg} style={styles.bgImage} />
      <View style={styles.gradientOverlay} />

      <View style={styles.tagContainer}>
        <Image source={{ uri: TagPillBg }} style={{width: 67, height: 24}} />
        <Text style={styles.tagText}>{scene.tag}</Text>
      </View>

      <View style={styles.characterList}>
        {scene.characters.map(character => (
          <View key={character.id} style={styles.characterRow}>
            <Text style={[styles.characterName, !character.active && styles.characterNameInactive]}>
              {character.name}
            </Text>
            {character.active && <Image source={{ uri: IconActiveDot }} style={{width: 4, height: 4}} />}
          </View>
        ))}
      </View>

      <View style={styles.locationRow}>
        <Image source={{ uri: IconLocation }} style={{width: 12, height: 12}} />
        <Text style={styles.locationText}>{scene.location}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tagContainer: {
    position: 'absolute',
    left: 12,
    top: 12,
    height: 24,
    justifyContent: 'center',
  },
  tagText: {
    position: 'absolute',
    left: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  characterList: {
    position: 'absolute',
    right: 12,
    top: 60,
    alignItems: 'flex-end',
    gap: 4,
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  characterName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  characterNameInactive: {
    opacity: 0.3,
  },
  locationRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
})
