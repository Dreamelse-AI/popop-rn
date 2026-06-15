import { View, Text, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'

export type ScriptCard = {
  id: string
  type: 'script' | 'character' | 'group' | 'post'
  title: string
  coverUrl: string
  authorName: string
  authorAvatar: string
  playCount: number
  tags: string[]
  desc?: string
  body?: string
  cornerTag?: string
  likeCount?: number
}

type ScriptCardProps = {
  card: ScriptCard
  onClick: (id: string) => void
}

export function ScriptCardItem({ card, onClick }: ScriptCardProps) {
  if (card.type === 'character') return <CharacterCardView card={card} onClick={onClick} />
  if (card.type === 'group') return <GroupCardView card={card} onClick={onClick} />
  if (card.type === 'post') return <PostCardView card={card} onClick={onClick} />
  return <ScriptCardView card={card} onClick={onClick} />
}

function ScriptCardView({ card, onClick }: ScriptCardProps) {
  return (
    <Pressable onPress={() => onClick(card.id)} style={styles.card}>
      <View style={styles.coverScript}>
        {card.coverUrl ? (
          <Image source={{ uri: card.coverUrl }} style={styles.coverImage} />
        ) : null}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.gradientBottom25} />
        {card.tags.length > 0 && (
          <Text style={styles.coverTags}>{card.tags.slice(0, 2).join('·')}</Text>
        )}
      </View>
      <View style={styles.infoSection}>
        <Text style={styles.titleSm} numberOfLines={2}>{card.title}</Text>
        <View style={styles.metaRow}>
          {card.cornerTag ? (
            <Text style={styles.cornerTag} numberOfLines={1}>{card.cornerTag}</Text>
          ) : (
            <View />
          )}
          <Text style={styles.heartIcon}>♡</Text>
        </View>
      </View>
    </Pressable>
  )
}

function CharacterCardView({ card, onClick }: ScriptCardProps) {
  return (
    <Pressable onPress={() => onClick(card.id)} style={styles.card}>
      <View style={styles.coverScript}>
        {card.coverUrl ? (
          <Image source={{ uri: card.coverUrl }} style={styles.coverImage} />
        ) : null}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.gradientBottom70} />
        <Text style={styles.quoteChar}>"</Text>
        <Text style={styles.coverDesc} numberOfLines={2}>
          {card.desc || card.tags.join(', ')}
        </Text>
      </View>
      <View style={styles.infoSection}>
        <Text style={styles.titleBase} numberOfLines={1}>{card.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.tagsRow}>
            {card.tags.slice(0, 2).map(tag => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.likeRow}>
            {(card.likeCount ?? 0) > 0 && (
              <Text style={styles.likeCount}>{card.likeCount}</Text>
            )}
            <Text style={styles.heartIcon}>♡</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function GroupCardView({ card, onClick }: ScriptCardProps) {
  return (
    <Pressable onPress={() => onClick(card.id)} style={styles.card}>
      <View style={styles.coverSquare}>
        {card.coverUrl ? (
          <Image source={{ uri: card.coverUrl }} style={styles.coverImage} />
        ) : null}
      </View>
      <View style={styles.infoSection}>
        <Text style={styles.titleSm} numberOfLines={1}>{card.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.cornerTag}>{card.tags[0] ?? ''}</Text>
          <Text style={styles.heartIcon}>♡</Text>
        </View>
      </View>
    </Pressable>
  )
}

function PostCardView({ card, onClick }: ScriptCardProps) {
  const hasImage = !!card.coverUrl

  return (
    <Pressable onPress={() => onClick(card.id)} style={styles.card}>
      {hasImage && (
        <View style={styles.coverPost}>
          <Image source={{ uri: card.coverUrl }} style={styles.coverImage} />
        </View>
      )}
      <View style={hasImage ? styles.infoSection : styles.infoSectionPadded}>
        <Text style={[hasImage ? styles.titleSm : styles.titleBase, { lineHeight: hasImage ? 18 : 22 }]} numberOfLines={hasImage ? 1 : 2}>
          {card.title}
        </Text>
        {!hasImage && card.body && (
          <Text style={styles.bodyText} numberOfLines={7}>{card.body}</Text>
        )}
      </View>
      <View style={styles.postFooter}>
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            {card.authorAvatar ? (
              <Image source={{ uri: card.authorAvatar }} style={styles.authorAvatarImage} />
            ) : null}
          </View>
          <Text style={styles.authorName} numberOfLines={1}>{card.authorName}</Text>
        </View>
        <View style={styles.likeRow}>
          {(card.likeCount ?? 0) > 0 && (
            <Text style={styles.likeCount}>{card.likeCount}</Text>
          )}
          <Text style={styles.heartIcon}>♡</Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverScript: {
    width: '100%',
    aspectRatio: 183 / 248,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverSquare: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverPost: {
    width: '100%',
    aspectRatio: 183 / 240,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientBottom25: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '25%',
  },
  gradientBottom70: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  coverTags: {
    position: 'absolute',
    left: 12,
    bottom: 8,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    zIndex: 10,
  },
  quoteChar: {
    position: 'absolute',
    left: 12,
    bottom: 32,
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 40,
  },
  coverDesc: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  infoSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoSectionPadded: {
    padding: 12,
  },
  titleSm: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 18,
  },
  titleBase: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 22,
  },
  bodyText: {
    marginTop: 4,
    fontSize: 14,
    color: '#000000',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    minHeight: 20,
  },
  cornerTag: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.4)',
  },
  heartIcon: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.3)',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tagChip: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.8)',
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  authorAvatarImage: {
    width: 20,
    height: 20,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
})
