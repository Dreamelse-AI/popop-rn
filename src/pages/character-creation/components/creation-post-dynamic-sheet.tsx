import { useCallback, useMemo, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useCharacterProfilePage } from '@/features/character/hooks/use-character-profile-page'
import type { CharacterProfileData } from '@/features/character/types'
import { uploadCharacterAppearanceImage } from '@/features/character-creation/lib/upload-character-image'
import { publishCharacterPost } from '@/features/post/lib/publish-character-post'
import {
  markPostDynamicPublishSuccess,
  PostDynamicComposePage,
  PostDynamicEntryButton,
  type PostDynamicComposePayload,
} from '@/features/post-dynamic'
import { CharacterProfilePostsList } from '@/pages/character/components/character-profile-posts-list'
import { CharacterProfilePostsOverlay } from '@/pages/character/components/character-profile-posts-overlay'
import { FullscreenPage, PageHeaderBar, BackButton } from '@/shared/ui/fullscreen-page'
import { showGlobalToast } from '@/shared/wallet'

type CreationPostDynamicSheetProps = {
  open: boolean
  characterId: string
  characterName: string
  characterCoverUrl?: string | null
  onClose: () => void
  onPublishSuccess?: () => void
  /** 嵌在 Home Tab 内时父级已处理安全区 */
  includeSafeAreaTop?: boolean
}

/** 发布动态页：上方发布入口 + 下方历史动态列表（展示逻辑复用角色主页） */
export function CreationPostDynamicSheet({
  open,
  characterId,
  characterName,
  characterCoverUrl,
  onClose,
  onPublishSuccess,
  includeSafeAreaTop = true,
}: CreationPostDynamicSheetProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [composeOpen, setComposeOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [postsOverlayOpen, setPostsOverlayOpen] = useState(false)
  const [initialPostId, setInitialPostId] = useState<string | undefined>()

  const profileFallback = useMemo<CharacterProfileData | null>(() => {
    if (!open || !characterId) return null
    const cover = characterCoverUrl?.trim() || ''
    return {
      id: characterId,
      name: characterName,
      avatar: cover,
      heroImage: cover,
      heroImageOverlay: cover,
      tags: '',
      chatCount: '0',
    }
  }, [characterCoverUrl, characterId, characterName, open])

  const {
    cells,
    posts,
    postsLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useCharacterProfilePage(open ? characterId : '', { profileFallback })

  const openPostsOverlay = useCallback((postId: string) => {
    setInitialPostId(postId)
    setPostsOverlayOpen(true)
  }, [])

  const closePostsOverlay = useCallback(() => {
    setPostsOverlayOpen(false)
    setInitialPostId(undefined)
  }, [])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
      const remaining = contentSize.height - layoutMeasurement.height - contentOffset.y
      if (hasMore && !loadingMore && !postsLoading && remaining < 400) {
        void loadMore()
      }
    },
    [hasMore, loadMore, loadingMore, postsLoading],
  )

  const handleSystemAlbumUpload = useCallback(async (uris: string[]) => {
    return Promise.all(uris.map((uri) => uploadCharacterAppearanceImage(uri)))
  }, [])

  const handlePublish = useCallback(
    async (payload: PostDynamicComposePayload) => {
      setPublishing(true)
      try {
        await publishCharacterPost({
          characterId,
          characterName,
          characterCoverUrl,
          content: payload.text,
          imageUrls: payload.imageUrls,
          bgmMusicKey: payload.musicId,
        })
        setComposeOpen(false)
        markPostDynamicPublishSuccess()
        onClose()
        onPublishSuccess?.()
      } catch (error) {
        console.error('[CreationPostDynamicSheet] publish failed:', error)
        showGlobalToast(t('character.creation.postPublishFailed'))
        throw error
      } finally {
        setPublishing(false)
      }
    },
    [characterCoverUrl, characterId, characterName, onClose, onPublishSuccess, t],
  )

  if (!open) return null

  const showEmptyState = !postsLoading && !error && cells.length === 0

  return (
    <>
      <FullscreenPage backgroundColor="#f7f7f7">
        <PageHeaderBar includeSafeAreaTop={includeSafeAreaTop}>
          <BackButton onPress={onClose} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {characterName}
          </Text>
        </PageHeaderBar>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(24, insets.bottom) },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <PostDynamicEntryButton onPress={() => setComposeOpen(true)} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              {t('character.creation.dynamicHistory')}
            </Text>
          </View>

          {error ? (
            <CharacterProfilePostsList
              cells={[]}
              error
              errorText={t('character.creation.loadFailed')}
              onRetry={() => void refresh()}
            />
          ) : showEmptyState ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('character.creation.noDynamics')}</Text>
            </View>
          ) : (
            <CharacterProfilePostsList
              cells={cells}
              loading={postsLoading}
              loadingMore={loadingMore}
              onCellClick={openPostsOverlay}
            />
          )}
        </ScrollView>

        {postsOverlayOpen ? (
          <CharacterProfilePostsOverlay
            characterName={characterName}
            posts={posts}
            initialPostId={initialPostId}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onClose={closePostsOverlay}
          />
        ) : null}
      </FullscreenPage>

      <PostDynamicComposePage
        open={composeOpen}
        characterId={characterId}
        characterName={characterName}
        publishing={publishing}
        onClose={() => {
          if (publishing) return
          setComposeOpen(false)
        }}
        onPublish={handlePublish}
        onSystemAlbumUpload={handleSystemAlbumUpload}
      />
    </>
  )
}

const styles = StyleSheet.create({
  headerTitle: {
    maxWidth: '60%',
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'column',
  },
  sectionHeader: {
    paddingBottom: 8,
    paddingLeft: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 64,
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  emptyContainer: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
})
