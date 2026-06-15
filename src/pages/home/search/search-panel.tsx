import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

import { friendshipApi } from '@/features/friendship/api'
import { useFeedSearch } from '@/features/feed/search/hooks/use-feed-search'
import { useDiscoverGrid } from '@/features/feed/search/hooks/use-discover-grid'
import type { SearchChatItem, SearchStoryItem, DiscoverGridItem } from '@/features/feed/search/types'

import IconSearchSolid from '@/shared/assets/feed/icon/icon-search-solid.svg'
import { Image } from 'expo-image'

type SearchPanelProps = {
  open: boolean
  onClose: () => void
}

export function SearchPanel({ open, onClose }: SearchPanelProps) {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [tab, setTab] = useState<'story' | 'chat'>('story')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [addingId, setAddingId] = useState<string | null>(null)
  const inputRef = useRef<TextInput>(null)
  const { stories, chats, loading, error, searched, search, reset } = useFeedSearch()
  const discover = useDiscoverGrid(open)
  const activeSearchType = tab === 'story' ? 'post' : 'character'

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
    setTab('story')
    search(kw, 'post')
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

  if (!open) return null

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Search Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton} accessibilityLabel="뒤로가기">
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

          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              placeholder="搜索角色、故事..."
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={styles.input}
              returnKeyType="search"
            />
            <View style={styles.divider} />
            <Pressable onPress={handleSearch} style={styles.searchIconButton} accessibilityLabel="검색">
              <IconSearchSolid width={24} height={24} />
            </Pressable>
          </View>
        </View>

        {/* Tabs */}
        {searched && (
          <View style={styles.tabBar}>
            <Pressable onPress={() => handleTabChange('story')} style={styles.tabItem}>
              <Text style={[styles.tabText, tab === 'story' ? styles.tabTextActive : styles.tabTextInactive]}>
                故事
              </Text>
              {tab === 'story' && <View style={styles.tabIndicator} />}
            </Pressable>
            <Pressable onPress={() => handleTabChange('chat')} style={styles.tabItem}>
              <Text style={[styles.tabText, tab === 'chat' ? styles.tabTextActive : styles.tabTextInactive]}>
                聊天
              </Text>
              {tab === 'chat' && <View style={styles.tabIndicator} />}
            </Pressable>
          </View>
        )}

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {!searched ? (
            <InitialGrid items={discover.items} loading={discover.loading} />
          ) : loading[activeSearchType] ? (
            <Text style={styles.emptyText}>搜索中...</Text>
          ) : error[activeSearchType] ? (
            <Text style={styles.emptyText}>搜索失败，请稍后重试</Text>
          ) : tab === 'story' ? (
            <StoryGrid results={stories} />
          ) : (
            <ChatList
              results={chats}
              addedIds={addedIds}
              addingId={addingId}
              onAdd={handleAddFriend}
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

function InitialGrid({ items, loading }: { items: DiscoverGridItem[]; loading: boolean }) {
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
        <View key={img.id} style={styles.gridItem}>
          <Image source={{ uri: img.coverUrl }} style={styles.gridImage} />
        </View>
      ))}
    </View>
  )
}

function StoryGrid({ results }: { results: SearchStoryItem[] }) {
  if (results.length === 0) {
    return <Text style={styles.emptyText}>没有找到相关故事</Text>
  }

  return (
    <View style={styles.grid2}>
      {results.map(item => (
        <View key={item.id} style={styles.storyCard}>
          <Image source={{ uri: item.coverUrl }} style={styles.storyImage} />
          <View style={styles.storyGradient} />
          <View style={styles.storyInfo}>
            <Text style={styles.storyTitle}>{item.title || item.authorName}</Text>
            <Text style={styles.storyBody} numberOfLines={2}>{item.body}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function ChatList({
  results,
  addedIds,
  addingId,
  onAdd,
}: {
  results: SearchChatItem[]
  addedIds: Set<string>
  addingId: string | null
  onAdd: (id: string) => void
}) {
  if (results.length === 0) {
    return <Text style={styles.emptyText}>没有找到相关角色</Text>
  }

  return (
    <View style={styles.chatList}>
      {results.map(item => {
        const added = addedIds.has(item.id)
        const adding = addingId === item.id
        return (
          <View key={item.id} style={styles.chatRow}>
            <View style={styles.chatAvatar}>
              <Image source={{ uri: item.avatar }} style={styles.chatAvatarImage} />
            </View>
            <View style={styles.chatTextWrapper}>
              <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.chatDesc} numberOfLines={1}>{item.description}</Text>
            </View>
            {added ? (
              <Text style={styles.addedText}>已添加</Text>
            ) : (
              <Pressable
                onPress={() => void onAdd(item.id)}
                disabled={adding}
                style={[styles.addButton, adding && styles.addButtonDisabled]}
              >
                <Text style={styles.addButtonText}>{adding ? '添加中...' : '添加好友'}</Text>
              </Pressable>
            )}
          </View>
        )
      })}
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
    gap: 2,
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
    marginTop: 2,
    height: 4,
    width: '100%',
    borderRadius: 2,
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
    paddingHorizontal: 8,
    gap: 4,
  },
  gridSkeletonItem: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  gridItem: {
    width: '32%',
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
    paddingHorizontal: 8,
    gap: 4,
  },
  storyCard: {
    width: '49%',
    aspectRatio: 185 / 328,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  storyGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'transparent',
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
