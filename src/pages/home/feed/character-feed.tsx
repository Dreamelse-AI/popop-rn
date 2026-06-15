import { useState, useEffect } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'

import { ScriptCardItem, type ScriptCard } from './script-card'
import { Image } from 'expo-image'

type CharacterInfo = {
  id: string
  name: string
  avatar: string
  tagline: string
}

type CharacterFeedProps = {
  characterId: string
  isVisible: boolean
}

export function CharacterFeed({ characterId, isVisible }: CharacterFeedProps) {
  const [cards, setCards] = useState<ScriptCard[]>([])

  useEffect(() => {
    setCards(MOCK_CHARACTER_SCRIPTS)
  }, [characterId])

  if (!isVisible) return null

  return (
    <View style={styles.container}>
      <View style={styles.masonryGrid}>
        {cards.map(card => (
          <View key={card.id} style={styles.masonryItem}>
            <ScriptCardItem card={card} onClick={id => console.log('Navigate to script:', id)} />
          </View>
        ))}
      </View>
    </View>
  )
}

type CharacterFeedListProps = {
  isVisible: boolean
}

export function CharacterFeedList({ isVisible }: CharacterFeedListProps) {
  const [characters] = useState<CharacterInfo[]>(MOCK_CHARACTERS)
  const [currentId, setCurrentId] = useState(MOCK_CHARACTERS[0]?.id ?? '')

  if (!isVisible) return null

  return (
    <View style={styles.listContainer}>
      {/* Character avatar row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarRow}
        style={styles.avatarRowContainer}
      >
        {characters.map(char => (
          <Pressable
            key={char.id}
            onPress={() => setCurrentId(char.id)}
            style={styles.avatarItem}
          >
            <View
              style={[
                styles.avatarCircle,
                currentId === char.id ? styles.avatarCircleActive : styles.avatarCircleInactive,
              ]}
            >
              {char.avatar ? (
                <Image source={{ uri: char.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{char.name.charAt(0)}</Text>
              )}
            </View>
            <Text
              style={[
                styles.avatarName,
                currentId === char.id ? styles.avatarNameActive : styles.avatarNameInactive,
              ]}
              numberOfLines={1}
            >
              {char.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Character's script list */}
      <CharacterFeed characterId={currentId} isVisible={true} />
    </View>
  )
}

const MOCK_CHARACTERS: CharacterInfo[] = [
  { id: 'c1', name: 'Luna', avatar: '', tagline: 'Mysterious night elf' },
  { id: 'c2', name: 'Kai', avatar: '', tagline: 'Cyberpunk hacker' },
  { id: 'c3', name: 'Mira', avatar: '', tagline: 'Gentle healer' },
  { id: 'c4', name: 'Rex', avatar: '', tagline: 'Dragon knight' },
  { id: 'c5', name: 'Yuki', avatar: '', tagline: 'Shrine maiden' },
  { id: 'c6', name: 'Zara', avatar: '', tagline: 'Space pirate captain' },
]

const MOCK_CHARACTER_SCRIPTS: ScriptCard[] = [
  { id: 'cs1', type: 'script', title: 'A Night in the Enchanted Grove', coverUrl: 'https://picsum.photos/seed/c1/300/400', authorName: 'Luna', authorAvatar: '', playCount: 450, tags: ['Fantasy'] },
  { id: 'cs2', type: 'script', title: 'Starlight Confession', coverUrl: 'https://picsum.photos/seed/c2/300/400', authorName: 'Luna', authorAvatar: '', playCount: 320, tags: ['Romance'] },
  { id: 'cs3', type: 'script', title: 'The Lost Artifact', coverUrl: 'https://picsum.photos/seed/c3/300/400', authorName: 'Luna', authorAvatar: '', playCount: 180, tags: ['Adventure'] },
  { id: 'cs4', type: 'script', title: 'Midnight Tea Party', coverUrl: 'https://picsum.photos/seed/c4/300/400', authorName: 'Luna', authorAvatar: '', playCount: 560, tags: ['Slice of Life'] },
  { id: 'cs5', type: 'script', title: 'Forest Guardian Awakens', coverUrl: 'https://picsum.photos/seed/c5/300/400', authorName: 'Luna', authorAvatar: '', playCount: 290, tags: ['Fantasy'] },
  { id: 'cs6', type: 'script', title: 'Moonlit Dance', coverUrl: 'https://picsum.photos/seed/c6/300/400', authorName: 'Luna', authorAvatar: '', playCount: 410, tags: ['Romance'] },
]

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  masonryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  masonryItem: {
    width: '48%',
  },
  listContainer: {
    flex: 1,
  },
  avatarRowContainer: {
    backgroundColor: '#f1f1f1',
    zIndex: 10,
  },
  avatarRow: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatarItem: {
    alignItems: 'center',
    gap: 4,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarCircleActive: {
    backgroundColor: '#6366f1',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    transform: [{ scale: 1.1 }],
  },
  avatarCircleInactive: {
    backgroundColor: '#d1d5db',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarName: {
    fontSize: 10,
    width: 48,
    textAlign: 'center',
  },
  avatarNameActive: {
    color: '#000000',
    fontWeight: '500',
  },
  avatarNameInactive: {
    color: 'rgba(0,0,0,0.4)',
  },
})
