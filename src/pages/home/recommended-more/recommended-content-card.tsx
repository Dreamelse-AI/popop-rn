import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'

import { ChatCountBadge } from '@/shared/ui/chat-count-badge'
import { useOpenCharacterChat } from '@/features/friendship/hooks/use-open-character-chat'
import { Image } from 'expo-image'

type RecommendedContentCardProps = {
  item: {
    characterId: string
    image: string
    name: string
    tags: string
    chatCount: string
    height: number
    badgeBlur?: boolean
  }
}

export function RecommendedContentCard({ item }: RecommendedContentCardProps) {
  const { t } = useTranslation()
  const openCharacterChat = useOpenCharacterChat()

  return (
    <View style={[styles.container, { height: item.height }]}>
      <Image source={{ uri: item.image }} style={styles.backgroundImage} />

      <View style={styles.badgeWrapper}>
        <ChatCountBadge count={item.chatCount} blur={item.badgeBlur} />
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,1)']}
        style={styles.gradient}
      >
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.tags} numberOfLines={1}>{item.tags}</Text>
        </View>
        <Pressable
          style={styles.talkButton}
          onPress={() => void openCharacterChat(item.characterId)}
        >
          <Text style={styles.talkButtonText}>{t('feed.talk')}</Text>
        </Pressable>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
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
  },
  textContainer: {
    gap: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  tags: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
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
    fontWeight: '700',
    color: '#000000',
  },
})
