import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'

import type { HomeFeedCharacter } from '@/features/feed/feed-types'
import { useOpenCharacterChat } from '@/features/friendship/hooks/use-open-character-chat'
import { ChatCountBadge, formatChatCount } from '@/shared/ui/chat-count-badge'
import { Image } from 'expo-image'

type FeedCharacterCardProps = {
  character: HomeFeedCharacter
  variant: 'scroll' | 'grid'
  height?: number
  badgeBlur?: boolean
  onCharacterClick?: (character: HomeFeedCharacter) => void
}

export function FeedCharacterCard({
  character,
  variant,
  height,
  badgeBlur = false,
  onCharacterClick,
}: FeedCharacterCardProps) {
  const { t } = useTranslation()
  const openCharacterChat = useOpenCharacterChat()

  function handlePress() {
    onCharacterClick?.(character)
  }

  const isScroll = variant === 'scroll'
  const cardStyle = isScroll
    ? styles.scrollCard
    : [styles.gridCard, height ? { height } : undefined]

  return (
    <Pressable
      onPress={handlePress}
      style={cardStyle}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: character.image }}
        style={styles.backgroundImage}
      />

      {character.chatMessageCount != null && character.chatMessageCount > 0 && (
        <View style={styles.badgeWrapper}>
          <ChatCountBadge
            count={formatChatCount(character.chatMessageCount)}
            blur={badgeBlur}
          />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,1)']}
        style={styles.gradient}
      >
        <View style={styles.textContainer}>
          <Text style={styles.characterName}>{character.name}</Text>
          <Text style={styles.characterTags} numberOfLines={2}>
            {character.tags || character.desc}
          </Text>
        </View>
        <Pressable
          style={styles.talkButton}
          onPress={(e) => {
            e.stopPropagation?.()
            void openCharacterChat(character.characterId)
          }}
        >
          <Text style={styles.talkButtonText}>{t('feed.talk')}</Text>
        </Pressable>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  scrollCard: {
    width: 160,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gridCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  badgeWrapper: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 68,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  textContainer: {
    gap: 3,
  },
  characterName: {
    fontSize: 20,
    lineHeight: 21,
    fontFamily: 'Black Han Sans',
    color: '#ffffff',
  },
  characterTags: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: 'rgba(255,255,255,0.5)',
    opacity: 0.8,
  },
  talkButton: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  talkButtonText: {
    fontSize: 12,
    fontFamily: 'Black Han Sans',
    lineHeight: 12,
    color: '#000000',
  },
})
