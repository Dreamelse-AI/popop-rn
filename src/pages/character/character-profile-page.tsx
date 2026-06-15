import { useCallback, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useCharacterProfilePage } from '@/features/character/hooks/use-character-profile-page'

import { CharacterProfileGrid } from './components/character-profile-grid'
import { CharacterProfileHeader } from './components/character-profile-header'
import { CharacterProfilePostsOverlay } from './components/character-profile-posts-overlay'
import {
  CHARACTER_PROFILE_SCROLL_SLOT_HEIGHT,
  getScrollProgress,
} from './components/character-profile-scroll'
import { CharacterProfileStickyHero } from './components/character-profile-sticky-hero'

type CharacterProfilePageProps = {
  characterId: string
  onClose: () => void
  onOpenDetail: () => void
}

export function CharacterProfilePage({
  characterId,
  onClose,
  onOpenDetail,
}: CharacterProfilePageProps) {
  const insets = useSafeAreaInsets()
  const [collapseProgress, setCollapseProgress] = useState(0)
  const [postsOverlayOpen, setPostsOverlayOpen] = useState(false)
  const [initialPostId, setInitialPostId] = useState<string | undefined>()

  const {
    profile,
    cells,
    posts,
    imageCount,
    loading,
    postsLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  } = useCharacterProfilePage(characterId)

  const openPostsOverlay = useCallback((postId: string) => {
    setInitialPostId(postId)
    setPostsOverlayOpen(true)
  }, [])

  const closePostsOverlay = useCallback(() => {
    setPostsOverlayOpen(false)
    setInitialPostId(undefined)
  }, [])

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollTop = event.nativeEvent.contentOffset.y
    setCollapseProgress(getScrollProgress(scrollTop))

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const remaining = contentSize.height - layoutMeasurement.height - contentOffset.y
    if (hasMore && !loadingMore && !postsLoading && remaining < 400) {
      void loadMore()
    }
  }, [hasMore, loadMore, loadingMore, postsLoading])

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
        </View>
      </View>
    )
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>找不到该角色</Text>
          <Pressable onPress={onClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>返回</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CharacterProfileHeader
        characterId={characterId}
        characterName={profile.name}
        onClose={onClose}
      />

      <CharacterProfileStickyHero
        progress={collapseProgress}
        avatar={profile.avatar}
        heroImage={profile.heroImage}
        heroImageOverlay={profile.heroImageOverlay}
        chatCount={profile.chatCount}
        name={profile.name}
        tags={profile.tags}
        imageCount={imageCount}
        onViewInfo={onOpenDetail}
      />

      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: CHARACTER_PROFILE_SCROLL_SLOT_HEIGHT }} />
        <CharacterProfileGrid
          cells={cells}
          loading={postsLoading}
          loadingMore={loadingMore}
          onCellClick={openPostsOverlay}
        />
      </ScrollView>

      {postsOverlayOpen && (
        <CharacterProfilePostsOverlay
          characterName={profile.name}
          posts={posts}
          initialPostId={initialPostId}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onClose={closePostsOverlay}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.5)',
  },
  backButton: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
})
