import { useCallback } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native'
import type { FeedPost, Character } from '@/features/feed/feed-types'

type FeedItem = FeedPost

type Props = {
  items: FeedPost[]
  characters: Character[]
  onCharacterClick: (characterId: string) => void
  onEndReached?: () => void
  ListHeaderComponent?: React.ReactElement
}

export function FeedList({ items, characters, onCharacterClick, onEndReached, ListHeaderComponent }: Props) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedItem>) => {
      if (item.type === 'character_card') {
        return (
          <CharacterCard
            character={characters.find(c => c.id === item.characterId)}
            onClick={() => onCharacterClick(item.characterId)}
          />
        )
      }
      return <PostCard post={item} onAvatarClick={() => onCharacterClick(item.characterId)} />
    },
    [characters, onCharacterClick],
  )

  const keyExtractor = useCallback((item: FeedItem) => item.id, [])

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.container}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
    />
  )
}

function PostCard({ post, onAvatarClick }: { post: FeedPost; onAvatarClick: () => void }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Pressable onPress={onAvatarClick} style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{post.characterName.charAt(0)}</Text>
        </Pressable>
        <View style={styles.postHeaderText}>
          <Text style={styles.postName} numberOfLines={1}>{post.characterName}</Text>
          <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      <View style={styles.postFooter}>
        <Text style={styles.postStat}>♥ {post.likeCount}</Text>
        <Text style={styles.postStat}>💬 {post.commentCount}</Text>
      </View>
    </View>
  )
}

function CharacterCard({ character, onClick }: { character?: Character; onClick: () => void }) {
  if (!character) return null

  return (
    <Pressable onPress={onClick} style={styles.characterCard}>
      <View style={styles.characterHeader}>
        <View style={styles.characterAvatar}>
          <Text style={styles.characterAvatarText}>{character.name.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.characterName}>{character.name}</Text>
          <Text style={styles.characterTagline}>{character.tagline}</Text>
        </View>
      </View>
      <View style={styles.characterTags}>
        {character.tags.map(tag => (
          <View key={tag} style={styles.characterTagChip}>
            <Text style={styles.characterTagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.characterChatCount}>{character.chatCount.toLocaleString()} chats</Text>
    </Pressable>
  )
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  postCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  postHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  postName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  postTime: {
    fontSize: 12,
    color: '#64748b',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#e2e8f0',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  postStat: {
    fontSize: 12,
    color: '#94a3b8',
  },
  characterCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(49,46,129,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.3)',
  },
  characterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  characterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  characterName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  characterTagline: {
    fontSize: 12,
    color: '#94a3b8',
  },
  characterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  characterTagChip: {
    backgroundColor: 'rgba(49,46,129,0.5)',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  characterTagText: {
    fontSize: 12,
    color: '#a5b4fc',
  },
  characterChatCount: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
  },
})
