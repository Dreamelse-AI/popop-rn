import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'
import { cdnImage } from '@/shared/lib/cdn'

import { FEED_RECOMMENDED_PREVIEW_LIMIT } from '../../features/feed/lib/recommended-characters'
import type { HomeFeedCharacter } from '@/features/feed/feed-types'
import { FeedCharacterCard } from '@/features/feed/ui/feed-character-card'

const IconChevronRight = cdnImage('assets/feed/icon/chevron-right.png')

type RecommendedSectionProps = {
  items: HomeFeedCharacter[]
  onCharacterClick?: (character: HomeFeedCharacter) => void
}

export function RecommendedSection({ items, onCharacterClick }: RecommendedSectionProps) {
  const { t } = useTranslation()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const previewItems = items.slice(0, FEED_RECOMMENDED_PREVIEW_LIMIT)

  if (previewItems.length === 0) return null

  function openRecommendedMore() {
    navigation.navigate('RecommendedMore', { featuredCharacters: items })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('feed.recommended')}</Text>
        <Pressable onPress={openRecommendedMore} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>{t('feed.viewAll')}</Text>
          <View style={styles.chevronWrapper}>
            <Image source={{ uri: IconChevronRight }} style={{width: 16, height: 16}} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {previewItems.map(item => (
          <FeedCharacterCard
            key={item.characterId}
            character={item}
            variant="scroll"
            onCharacterClick={onCharacterClick}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 21,
    fontFamily: 'Black Han Sans',
    color: '#000000',
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  chevronWrapper: {
    transform: [{ rotate: '180deg' }],
  },
  scrollContent: {
    paddingLeft: 12,
    paddingRight: 4,
    gap: 8,
    paddingBottom: 4,
  },
})
