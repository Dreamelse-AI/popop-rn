import { useCallback, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useCharacterProfilePage } from '@/features/character/hooks/use-character-profile-page'

import { characterFixedNavHeaderOffsetHeight } from './components/character-fixed-nav-header'
import { CharacterProfileHeader } from './components/character-profile-header'
import { CharacterProfilePostsList, type CharacterProfileCellAnchor } from './components/character-profile-posts-list'
import { CharacterProfilePostsOverlay } from './components/character-profile-posts-overlay'
import {
  getCharacterProfileScrollSlotHeight,
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
  const [anchorRect, setAnchorRect] = useState<CharacterProfileCellAnchor | undefined>()

  const heroTopOffset = characterFixedNavHeaderOffsetHeight(insets.top)
  const scrollSlotHeight = getCharacterProfileScrollSlotHeight(insets.top)

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

  const openPostsOverlay = useCallback((postId: string, anchor: CharacterProfileCellAnchor) => {
    setInitialPostId(postId)
    setAnchorRect(anchor)
    setPostsOverlayOpen(true)
  }, [])

  const closePostsOverlay = useCallback(() => {
    setPostsOverlayOpen(false)
    setInitialPostId(undefined)
    setAnchorRect(undefined)
  }, [])

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollTop = event.nativeEvent.contentOffset.y
    setCollapseProgress(getScrollProgress(scrollTop))
  }, [])

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !postsLoading) {
      void loadMore()
    }
  }, [hasMore, loadMore, loadingMore, postsLoading])

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: heroTopOffset }]}>
          <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
        </View>
      </View>
    )
  }

  if (error || !profile) {
    return (
      <View style={styles.container}>
        <View style={[styles.errorContainer, { paddingTop: heroTopOffset }]}>
          <Text style={styles.errorText}>找不到该角色</Text>
          <Pressable onPress={onClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>返回</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CharacterProfileHeader
        characterId={characterId}
        characterName={profile.name}
        onClose={onClose}
      />

      <CharacterProfileStickyHero
        progress={collapseProgress}
        topOffset={heroTopOffset}
        avatar={profile.avatar}
        heroImage={profile.heroImage}
        heroImageOverlay={profile.heroImageOverlay}
        chatCount={profile.chatCount}
        name={profile.name}
        tags={profile.tags}
        imageCount={imageCount}
        onViewInfo={onOpenDetail}
      />

      <CharacterProfilePostsList
        cells={cells}
        loading={postsLoading}
        loadingMore={loadingMore}
        onCellClick={openPostsOverlay}
        scrollable
        headerSpacerHeight={scrollSlotHeight}
        onScroll={handleScroll}
        onEndReached={handleEndReached}
      />

      {postsOverlayOpen && (
        <CharacterProfilePostsOverlay
          characterName={profile.name}
          posts={posts}
          initialPostId={initialPostId}
          anchorRect={anchorRect}
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
