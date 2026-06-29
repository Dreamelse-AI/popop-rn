import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { cdnImage } from '@/shared/lib/cdn'

import type { RootStackParamList } from '@/app/navigation'
import { friendshipApi } from '@/features/friendship/api'
import { fetchFeedPostDetail } from '@/features/feed/lib/feed-entity-guard'
import { FeedPostViewer, mapPostDetail, formatPostTime } from '@/features/post'
import { useFeedSearch } from '@/features/feed/search/hooks/use-feed-search'
import { useDiscoverGrid } from '@/features/feed/search/hooks/use-discover-grid'
import type { SearchChatItem, SearchStoryItem, DiscoverGridItem } from '@/features/feed/search/types'

const IconSearchSolid = cdnImage('assets/feed/icon/icon-search-solid.png')

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const GRID_PADDING = 8
const GRID_GAP = 4
const GRID3_ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3
const GRID2_ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2

type SearchPanelProps = {
  open: boolean
  onClose: () => void
}

// STUB: SearchPanel component
export function SearchPanel({ open, onClose }: SearchPanelProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [tab, setTab] = useState<'story' | 'chat'>('story')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [addingId, setAddingId] = useState<string | null>(null)
  const inputRef = useRef<TextInput>(null)
  const { stories, chats, loading, error, searched, loadingMore, search, loadMore, reset } = useFeedSearch()
  const discover = useDiscoverGrid(open)
  const activeSearchType = tab === 'story' ? 'post' : 'character'

  const [postDetailOpen, setPostDetailOpen] = useState(false)
  const [postDetail, setPostDetail] = useState<{
    images: string[]
    characterName: string
    characterAvatar: string
    characterId: string
    postId: string
    impressionId?: string
    content: string
    timeAgo: string
    isLiked: boolean
  } | null>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setSubmittedQuery('')
      setTab('story')
      setAddedIds(new Set())
      setAddingId(null)
      reset()
    }
  }, [open, reset])

  const handleSearch = () => {
    const kw = query.trim()
    if (!kw) return
    setSubmittedQuery(kw)
    search(kw, activeSearchType)
  }

  const handleTabChange = (nextTab: 'story' | 'chat') => {
    setTab(nextTab)
    if (!searched || !submittedQuery) return
    search(submittedQuery, nextTab === 'story' ? 'post' : 'character')
  }

  const handleAddFriend = async (id: string) => {
    if (addingId || addedIds.has(id)) return
    setAddingId(id)
    try {
      await friendshipApi.addFriend(id)
      setAddedIds(prev => new Set(prev).add(id))
    } catch (e) {
      console.error('[SearchPanel] add friend failed:', e)
    } finally {
      setAddingId(null)
    }
  }

  const handleBack = () => {
    if (searched) {
      setQuery('')
      setSubmittedQuery('')
      reset()
    } else {
      onClose()
    }
  }

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
      if (searched) {
        loadMore(activeSearchType)
      } else {
        discover.loadMore()
      }
    }
  }, [activeSearchType, loadMore, searched, discover])

  const handlePostClick = useCallback(async (item: SearchStoryItem) => {
    try {
      const resp = await fetchFeedPostDetail(item.id, item.impressionId)
      const detail = mapPostDetail(resp.post)
      setPostDetail({
        images: detail.images.length > 0 ? detail.images : item.coverUrl ? [item.coverUrl] : [],
        characterName: detail.characterName || item.authorName,
        characterAvatar: detail.characterAvatar,
        characterId: detail.characterId,
        postId: detail.postId || item.id,
        impressionId: item.impressionId,
        content: detail.content || item.body,
        timeAgo: formatPostTime(new Date(detail.publishedAtMs).toISOString(), t),
        isLiked: detail.isLiked,
      })
      setPostDetailOpen(true)
    } catch (e) {
      console.error('[SearchPanel] load post detail failed:', e)
    }
  }, [t])

  const handleGridItemClick = useCallback(async (item: DiscoverGridItem) => {
    if (item.entityType === 'character') {
      navigation.navigate('CharacterDetail', { characterId: item.entityId, source: 'feed', impressionId: item.impressionId })
    } else {
      try {
        const resp = await fetchFeedPostDetail(item.entityId, item.impressionId)
        const detail = mapPostDetail(resp.post)
        setPostDetail({
          images: detail.images.length > 0 ? detail.images : [item.coverUrl],
          characterName: detail.characterName,
          characterAvatar: detail.characterAvatar,
          characterId: detail.characterId,
          postId: detail.postId || item.entityId,
          impressionId: item.impressionId,
          content: detail.content,
          timeAgo: formatPostTime(new Date(detail.publishedAtMs).toISOString(), t),
          isLiked: detail.isLiked,
        })
        setPostDetailOpen(true)
      } catch (e) {
        console.error('[SearchPanel] load grid post detail failed:', e)
      }
    }
  }, [navigation, t])

  const handleChatAvatarClick = useCallback((item: SearchChatItem) => {
    navigation.navigate('CharacterDetail', { characterId: item.id, source: 'feed', impressionId: item.impressionId })
  }, [navigation])

  if (!open) return null

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Search Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton} accessibilityLabel={t('common.back')}>
            <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
              <Path d="M7 1L1 7l6 6" stroke="black" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              placeholder={t('search.placeholder')}
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={styles.input}
              returnKeyType="search"
            />
            <View style={styles.divider} />
            <Pressable onPress={handleSearch} style={styles.searchIconButton} accessibilityLabel={t('search.search')}>
              <Image source={{ uri: IconSearchSolid }} style={{width: 24, height: 24}} />
            </Pressable>
          </View>
        </View>

        {/* Tabs */}
        {searched && (
          <View style={styles.tabBar}>
            <Pressable onPress={() => handleTabChange('story')} style={styles.tabItem}>
              <Text style={[styles.tabText, tab === 'story' ? styles.tabTextActive : styles.tabTextInactive]}>
                {t('search.tabStory')}
              </Text>
              {tab === 'story' && <View style={styles.tabIndicator} />}
            </Pressable>
            <Pressable onPress={() => handleTabChange('chat')} style={styles.tabItem}>
              <Text style={[styles.tabText, tab === 'chat' ? styles.tabTextActive : styles.tabTextInactive]}>
                {t('search.tabChat')}
              </Text>
              {tab === 'chat' && <View style={styles.tabIndicator} />}
            </Pressable>
          </View>
        )}

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} onScroll={handleScroll} scrollEventThrottle={200}>
          {!searched ? (
            <>
              <InitialGrid items={discover.items} loading={discover.loading} onItemClick={handleGridItemClick} />
              {discover.loadingMore && <Text style={styles.emptyText}>{t('search.searching')}</Text>}
            </>
          ) : loading[activeSearchType] ? (
            <Text style={styles.emptyText}>{t('search.searching')}</Text>
          ) : error[activeSearchType] ? (
            <Text style={styles.emptyText}>{t('search.searchFailed')}</Text>
          ) : tab === 'story' ? (
            <StoryGrid results={stories} onPostClick={handlePostClick} />
          ) : (
            <ChatList
              results={chats}
              addedIds={addedIds}
              addingId={addingId}
              onAdd={handleAddFriend}
              onAvatarClick={handleChatAvatarClick}
            />
          )}
          {searched && loadingMore[activeSearchType] && (
            <Text style={styles.emptyText}>{t('search.searching')}</Text>
          )}
        </ScrollView>
      </View>

      {postDetailOpen && postDetail && (
        <FeedPostViewer
          images={postDetail.images}
          characterName={postDetail.characterName}
          characterAvatar={postDetail.characterAvatar}
          characterId={postDetail.characterId}
          content={postDetail.content}
          timeAgo={postDetail.timeAgo}
          isLiked={postDetail.isLiked}
          postId={postDetail.postId}
          impressionId={postDetail.impressionId}
          onNavigateCharacter={(characterId) => {
            navigation.navigate('CharacterDetail', { characterId, source: 'feed' })
          }}
          onClose={() => { setPostDetailOpen(false); setPostDetail(null) }}
        />
      )}
    </Modal>
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
  },
  backButton: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingLeft: 16,
    paddingRight: 8,
    fontSize: 15,
    color: '#000000',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  searchIconButton: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#000000',
  },
  tabTextInactive: {
    color: 'rgba(0,0,0,0.4)',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  emptyText: {
    paddingVertical: 40,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  gridSkeletonItem: {
    width: GRID3_ITEM_WIDTH,
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  gridItem: {
    width: GRID3_ITEM_WIDTH,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  storyCard: {
    width: GRID2_ITEM_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  storyImage: {
    width: '100%',
    aspectRatio: 185 / 328,
  },
  storyGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  storyInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  storyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  storyBody: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  chatList: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e5e5e5',
  },
  chatAvatarImage: {
    width: 48,
    height: 48,
  },
  chatTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  chatDesc: {
    marginTop: 2,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
  },
  addedText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.4)',
  },
  addButton: {
    borderRadius: 9999,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
  },
})

function InitialGrid({ items, loading, onItemClick }: { items: DiscoverGridItem[]; loading: boolean; onItemClick: (item: DiscoverGridItem) => void }) {
  if (loading && items.length === 0) {
    return (
      <View style={styles.grid3}>
        {Array.from({ length: 21 }).map((_, i) => (
          <View key={i} style={styles.gridSkeletonItem} />
        ))}
      </View>
    )
  }
  if (items.length === 0) return null
  return (
    <View style={styles.grid3}>
      {items.map(img => (
        <Pressable key={img.id} style={styles.gridItem} onPress={() => onItemClick(img)}>
          <Image source={{ uri: img.coverUrl }} style={styles.gridImage} />
        </Pressable>
      ))}
    </View>
  )
}

function StoryGrid({ results, onPostClick }: { results: SearchStoryItem[]; onPostClick: (item: SearchStoryItem) => void }) {
  const { t } = useTranslation()
  if (results.length === 0) {
    return <Text style={styles.emptyText}>{t('search.noStories')}</Text>
  }
  return (
    <View style={styles.grid2}>
      {results.map(item => (
        <Pressable key={item.id} style={styles.storyCard} onPress={() => onPostClick(item)}>
          <Image source={{ uri: item.coverUrl }} style={styles.storyImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.storyGradient} />
          <View style={styles.storyInfo}>
            <Text style={styles.storyTitle}>{item.title || item.authorName}</Text>
            <Text style={styles.storyBody} numberOfLines={2}>{item.body}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

function ChatList({
  results,
  addedIds,
  addingId,
  onAdd,
  onAvatarClick,
}: {
  results: SearchChatItem[]
  addedIds: Set<string>
  addingId: string | null
  onAdd: (id: string) => void
  onAvatarClick: (item: SearchChatItem) => void
}) {
  const { t } = useTranslation()
  if (results.length === 0) {
    return <Text style={styles.emptyText}>{t('search.noCharacters')}</Text>
  }
  return (
    <View style={styles.chatList}>
      {results.map(item => {
        const added = addedIds.has(item.id)
        const adding = addingId === item.id
        return (
          <Pressable key={item.id} style={styles.chatRow} onPress={() => onAvatarClick(item)}>
            <View style={styles.chatAvatar}>
              <Image source={{ uri: item.avatar }} style={styles.chatAvatarImage} />
            </View>
            <View style={styles.chatTextWrapper}>
              <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.chatDesc} numberOfLines={1}>{item.description}</Text>
            </View>
            {added ? (
              <Text style={styles.addedText}>{t('search.added')}</Text>
            ) : (
              <Pressable
                onPress={(e) => { e.stopPropagation; onAdd(item.id) }}
                disabled={adding}
                style={[styles.addButton, adding && styles.addButtonDisabled]}
              >
                <Text style={styles.addButtonText}>{adding ? t('search.adding') : t('search.addFriend')}</Text>
              </Pressable>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}
