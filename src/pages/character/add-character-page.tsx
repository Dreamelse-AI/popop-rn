import { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { useAddableCharacters } from '@/features/character/hooks/use-addable-characters'

import IconBack from '@/shared/assets/character/add-character/icon-back.svg'
import IconSearch from '@/shared/assets/character/add-character/icon-search.svg'
import { Image } from 'expo-image'

type AddCharacterTab = 'chat' | 'create'

type AddCharacterPageProps = {
  onClose: () => void
  onSelectCharacter: (characterId: string) => void
  onOpenSearch: () => void
}

export function AddCharacterPage({ onClose, onSelectCharacter, onOpenSearch }: AddCharacterPageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<AddCharacterTab>('chat')
  const { items, loading, error } = useAddableCharacters(activeTab === 'chat')

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton} accessibilityLabel="返回">
          <IconBack width={36} height={36} />
        </Pressable>

        <View style={styles.tabsCenter}>
          <Pressable onPress={() => setActiveTab('chat')} style={styles.tab}>
            <Text style={[styles.tabText, activeTab === 'chat' ? styles.tabTextActive : styles.tabTextInactive]}>
              {t('character.chat')}
            </Text>
            {activeTab === 'chat' && <View style={styles.tabIndicator} />}
          </Pressable>
          <Pressable onPress={() => setActiveTab('create')} style={styles.tab}>
            <Text style={[styles.tabText, activeTab === 'create' ? styles.tabTextActive : styles.tabTextInactive]}>
              {t('character.create')}
            </Text>
            {activeTab === 'create' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>

        <View style={styles.headerRight} />
      </View>

      {activeTab === 'chat' ? (
        <>
          <View style={styles.searchBar}>
            <Pressable onPress={onOpenSearch} style={styles.searchButton}>
              <IconSearch width={16} height={16} style={{ opacity: 0.3 }} />
              <Text style={styles.searchPlaceholder}>{t('character.searchPlaceholder')}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading && items.length === 0 ? (
              <View style={styles.grid}>
                {Array.from({ length: 12 }).map((_, index) => (
                  <View key={index} style={styles.skeletonCircle} />
                ))}
              </View>
            ) : error && items.length === 0 ? (
              <Text style={styles.emptyText}>加载失败，请稍后重试</Text>
            ) : items.length === 0 ? (
              <Text style={styles.emptyText}>暂无可添加的角色</Text>
            ) : (
              <View style={styles.grid}>
                {items.map(item => (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectCharacter(item.id)}
                    style={styles.characterCircle}
                  >
                    <Image source={{ uri: item.image }} style={styles.characterImage} />
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <View style={styles.createPlaceholder}>
          <Text style={styles.emptyText}>Create Form</Text>
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsCenter: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -60 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#000000',
  },
  tabTextInactive: {
    color: 'rgba(0,0,0,0.5)',
  },
  tabIndicator: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: '#000000',
  },
  headerRight: {
    width: 36,
    height: 36,
  },
  searchBar: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  searchButton: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonCircle: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  characterCircle: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  createPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    paddingVertical: 40,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
})
