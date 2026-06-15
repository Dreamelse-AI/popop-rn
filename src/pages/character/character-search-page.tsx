import { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Svg, { Circle, Path } from 'react-native-svg'

import { useCharacterSearch } from '@/features/character/hooks/use-character-search'
import type { CharacterSearchItem } from '@/features/character/types'

import IconBack from '@/shared/assets/character/add-character/icon-back.svg'
import IconSearch from '@/shared/assets/character/add-character/icon-search.svg'
import { Image } from 'expo-image'

type CharacterSearchPageProps = {
  onClose: () => void
  onSelectCharacter: (characterId: string) => void
}

function SearchResultRow({
  item,
  showDivider,
  onSelect,
}: {
  item: CharacterSearchItem
  showDivider: boolean
  onSelect: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showFallback = !item.avatar || imageFailed
  const initial = item.name.charAt(0) || '?'

  return (
    <Pressable onPress={onSelect} style={styles.resultRow}>
      <View style={styles.resultAvatar}>
        {showFallback ? (
          <Text style={styles.resultAvatarInitial}>{initial}</Text>
        ) : (
          <Image
            source={{ uri: item.avatar }}
            style={styles.resultAvatarImage}
            onError={() => setImageFailed(true)}
          />
        )}
      </View>

      <View style={styles.resultText}>
        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
        {item.subtitle && (
          <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        )}
      </View>

      {showDivider && <View style={styles.resultDivider} />}
    </Pressable>
  )
}

export function CharacterSearchPage({ onClose, onSelectCharacter }: CharacterSearchPageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const { items, loading, error, searched } = useCharacterSearch(query)

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton} accessibilityLabel="返回">
          <IconBack width={36} height={36} />
        </Pressable>

        <View style={styles.searchInput}>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t('character.searchPlaceholder')}
            placeholderTextColor="rgba(0,0,0,0.3)"
            style={styles.input}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} style={styles.clearButton} accessibilityLabel="清除">
              <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <Circle cx={8} cy={8} r={7} fill="black" fillOpacity={0.15} />
                <Path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="black" strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            </Pressable>
          ) : null}
          <IconSearch width={20} height={20} style={{ opacity: 0.4 }} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && items.length === 0 ? (
          <View style={styles.skeletonList}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonText}>
                  <View style={styles.skeletonLine1} />
                  <View style={styles.skeletonLine2} />
                </View>
              </View>
            ))}
          </View>
        ) : error ? (
          <Text style={styles.emptyText}>加载失败，请稍后重试</Text>
        ) : !searched ? null : items.length === 0 ? (
          <Text style={styles.emptyText}>没有找到相关角色</Text>
        ) : (
          <View>
            {items.map((item, index) => (
              <SearchResultRow
                key={item.id}
                item={item}
                showDivider={index < items.length - 1}
                onSelect={() => onSelectCharacter(item.id)}
              />
            ))}
          </View>
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
    gap: 4,
    paddingHorizontal: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    padding: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8e8e8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultAvatarImage: {
    width: 48,
    height: 48,
  },
  resultAvatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
  },
  resultText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  resultSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#575757',
  },
  resultDivider: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 56,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  skeletonList: {
    gap: 0,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  skeletonText: {
    flex: 1,
    gap: 8,
  },
  skeletonLine1: {
    height: 16,
    width: '33%',
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  skeletonLine2: {
    height: 16,
    width: '66%',
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  emptyText: {
    paddingVertical: 40,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
})
