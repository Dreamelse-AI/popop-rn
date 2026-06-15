import { useCallback, useMemo, useRef } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

import type { HomeFeedCharacter } from '@/features/feed/feed-types'
import { useRecommendedMore } from '@/features/feed/hooks/use-recommended-more'
import {
  buildRecommendedGridRows,
  shouldUseBadgeBlur,
} from '../../../features/feed/lib/recommended-characters'
import { FeedCharacterCard } from '@/features/feed/ui/feed-character-card'

const LOAD_MORE_THRESHOLD_PX = 160

type RecommendedMorePageProps = {
  featuredCharacters: HomeFeedCharacter[]
  onBack: () => void
}

export function RecommendedMorePage({ featuredCharacters, onBack }: RecommendedMorePageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const featuredKey = useMemo(
    () => featuredCharacters.map(character => character.characterId).join('|'),
    [featuredCharacters],
  )

  const { characters, loading, loadingMore, hasMore, error, loadMore } = useRecommendedMore(
    featuredKey,
    featuredCharacters,
  )
  const rows = buildRecommendedGridRows(characters)
  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y
    if (distanceFromBottom <= LOAD_MORE_THRESHOLD_PX) {
      void loadMoreRef.current()
    }
  }, [])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="返回">
          <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
            <Path
              d="M7 1L1 7l6 6"
              stroke="black"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text style={styles.title}>{t('feed.recommended')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
      >
        {loading && characters.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.items.map((item, columnIndex) => (
                  <FeedCharacterCard
                    key={item.characterId}
                    character={item}
                    variant="grid"
                    height={row.height}
                    badgeBlur={shouldUseBadgeBlur(rowIndex, columnIndex)}
                  />
                ))}
              </View>
            ))}
          </View>
        )}

        {error && (
          <Text style={styles.errorText}>加载更多推荐失败</Text>
        )}

        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
          </View>
        )}

        {!loading && !hasMore && characters.length > 0 && (
          <Text style={styles.noMoreText}>没有更多了</Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    lineHeight: 21,
    fontFamily: 'Black Han Sans',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  gridContainer: {
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingMoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  errorText: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
  },
  noMoreText: {
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(0,0,0,0.3)',
  },
})
