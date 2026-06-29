import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'

import { StoryBarSection } from '@/features/feed/story/components/story-bar-section'
import type { StoryBarSectionRef, StoryCharacterClickPayload } from '@/features/feed/story/types'
import type { FeedLayoutItem } from '@/features/feed/lib/feed-layout-engine'
import type { FeedRefreshOutcome } from '@/features/feed/hooks/use-feed'
import { useFeed } from '@/features/feed/hooks/use-feed'
import { fetchFeedPostDetail, isPostDeleted } from '@/features/feed/lib/feed-entity-guard'
import type { HomeFeedCharacter, HomeFeedPost } from '@/features/feed/feed-types'
import { FeedPromoCard } from '@/features/feed/ui/feed-promo-card'
import { FeedPostViewer, mapPostDetail, formatPostTime, mapCharacterPosts } from '@/features/post'
import { StoryViewer, loadStoryViewerSession, useStoryReadStore, storyApi } from '@/features/story'
import type { StoryCharacter, StoryItem } from '@/features/story'
import type { StoryHeadline } from '@/features/feed/story/types'
import { Toast, useToast } from '@/shared/ui/toast'

import { FeedPost } from '../feed-post'
import { RecommendedSection } from '../recommended-section'

export type TagFeedRef = {
  refresh: () => Promise<FeedRefreshOutcome>
  tryLoadMore: () => void
}

function FeedLayoutList({
  items,
  onPostClick,
  onPostLiked,
  onCharacterClick,
}: {
  items: FeedLayoutItem[]
  onPostClick: (post: HomeFeedPost) => void
  onPostLiked: (post: HomeFeedPost, likeState: { isLiked: boolean; likeCount: number }) => void
  onCharacterClick: (character: HomeFeedCharacter) => void
}) {
  return (
    <>
      {items.map(item =>
        item.kind === 'post' ? (
          <FeedPost
            key={item.key}
            post={item.post}
            onImageClick={onPostClick}
            onCharacterClick={post =>
              onCharacterClick({
                characterId: post.characterId,
                impressionId: post.impressionId,
                name: post.characterName,
                image: post.characterAvatar,
                tags: '',
                desc: '',
              })
            }
            onLike={(post, likeState) => onPostLiked(post, likeState)}
          />
        ) : item.kind === 'promo' ? (
          <View key={item.key} style={styles.promoWrapper}>
            <FeedPromoCard promo={item.promo} />
          </View>
        ) : (
          <RecommendedSection
            key={item.key}
            items={item.characters}
            onCharacterClick={onCharacterClick}
          />
        ),
      )}
    </>
  )
}

export const TagFeed = forwardRef<TagFeedRef>(function TagFeed(_props, ref) {
  const { t } = useTranslation()
  const { toast, showToast } = useToast()
  const storyBarRef = useRef<StoryBarSectionRef>(null)
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    refresh: refreshFeedItems,
    loadMore,
    onPostLiked,
    onPostDetailClosed,
  } = useFeed()

  const [storyOpen, setStoryOpen] = useState(false)
  const [storyLoading, setStoryLoading] = useState(false)
  const [storyCharacters, setStoryCharacters] = useState<StoryCharacter[]>([])
  const [storyInitIndex, setStoryInitIndex] = useState(0)
  const [storyInitStoryIndex, setStoryInitStoryIndex] = useState<number | undefined>(0)
  const [storySessionKey, setStorySessionKey] = useState(0)

  const [activePostId, setActivePostId] = useState<string | null>(null)
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

  const markStoryRead = useStoryReadStore(s => s.markStoryRead)
  const markCharacterFullyRead = useStoryReadStore(s => s.markCharacterFullyRead)
  const headlineItemsRef = useRef<StoryHeadline[]>([])
  const postClickPendingRef = useRef(false)

  const refresh = useCallback(async (): Promise<FeedRefreshOutcome> => {
    await storyBarRef.current?.refresh()
    return refreshFeedItems()
  }, [refreshFeedItems])

  useImperativeHandle(
    ref,
    () => ({
      refresh,
      tryLoadMore: () => {
        if (hasMore && !loadingMore && !loading) {
          void loadMore()
        }
      },
    }),
    [hasMore, loadMore, loading, loadingMore, refresh],
  )

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const handleFeedCharacterClick = useCallback(
    (character: HomeFeedCharacter) => {
      navigation.navigate('CharacterDetail', { characterId: character.characterId, source: 'feed' })
    },
    [navigation],
  )

  const handleStoryRead = useCallback(
    (_characterId: string, storyId: string) => {
      markStoryRead(storyId)
    },
    [markStoryRead],
  )

  const handleCharacterFullyRead = useCallback(
    (characterId: string) => {
      markCharacterFullyRead(characterId)
    },
    [markCharacterFullyRead],
  )

  const handleStoryClose = useCallback(() => {
    setStoryOpen(false)
    setStoryCharacters([])
    void storyBarRef.current?.refresh()
  }, [])

  const handleStoryCharacterClick = useCallback(
    async (payload: StoryCharacterClickPayload) => {
      if (storyLoading) return

      setStoryLoading(true)
      try {
        headlineItemsRef.current = payload.headlineItems
        const session = await loadStoryViewerSession(
          payload.headlineItems,
          payload.characterId,
        )
        if (!session) return

        setStoryCharacters(session.characters)
        setStoryInitIndex(session.initialCharacterIndex)
        setStoryInitStoryIndex(session.initialStoryIndex)
        setStorySessionKey(key => key + 1)
        setStoryOpen(true)
      } finally {
        setStoryLoading(false)
      }
    },
    [storyLoading],
  )

  const handleFeedPostClick = useCallback(
    async (post: HomeFeedPost) => {
      if (postClickPendingRef.current) return

      postClickPendingRef.current = true
      setActivePostId(post.postId)
      try {
        const resp = await fetchFeedPostDetail(post.postId, post.impressionId)
        if (isPostDeleted(resp.post)) {
          showToast('帖子已删除')
          setActivePostId(null)
          return
        }

        const detail = mapPostDetail(resp.post)
        setPostDetail({
          images: detail.images.length > 0 ? detail.images : post.imageUrl ? [post.imageUrl] : [],
          characterName: detail.characterName || post.characterName,
          characterAvatar: detail.characterAvatar || post.characterAvatar,
          characterId: detail.characterId || post.characterId,
          postId: detail.postId || post.postId,
          impressionId: post.impressionId,
          content: detail.content || post.content,
          timeAgo: formatPostTime(new Date(detail.publishedAtMs).toISOString(), t),
          isLiked: post.isLiked,
        })
        setPostDetailOpen(true)
      } catch (error) {
        showToast('帖子已删除')
        setActivePostId(null)
        if (__DEV__) {
          console.error('load feed post detail failed', error)
        }
      } finally {
        postClickPendingRef.current = false
      }
    },
    [showToast, t],
  )

  const handleStoryImageClick = useCallback(
    async (story: StoryItem, character: StoryCharacter) => {
      try {
        if (story.contentId) {
          const resp = await storyApi.getPostDetail(story.contentId)
          const detail = mapPostDetail(resp.post)
          setPostDetail({
            images: detail.images,
            characterName: detail.characterName || character.name,
            characterAvatar: detail.characterAvatar || character.avatar,
            characterId: detail.characterId || character.id,
            postId: detail.postId,
            content: detail.content,
            timeAgo: formatPostTime(new Date(detail.publishedAtMs).toISOString(), t),
            isLiked: detail.isLiked,
          })
          setPostDetailOpen(true)
          return
        }

        const resp = await storyApi.listCharacterPosts({
          character_id: character.id,
          limit: 20,
        })
        const posts = mapCharacterPosts(resp.posts ?? [])
        const latest = posts[0]
        if (!latest) return

        setPostDetail({
          images: latest.images,
          characterName: character.name,
          characterAvatar: character.avatar,
          characterId: character.id,
          postId: latest.postId,
          content: latest.content,
          timeAgo: formatPostTime(new Date(latest.publishedAtMs).toISOString(), t),
          isLiked: latest.isLiked,
        })
        setPostDetailOpen(true)
      } catch (error) {
        if (__DEV__) {
          console.error('load story post detail failed', error)
        }
      }
    },
    [t],
  )

  const handlePostDetailClose = useCallback(() => {
    const postId = activePostId
    setPostDetailOpen(false)
    setPostDetail(null)
    setActivePostId(null)
    if (postId) {
      void onPostDetailClosed(postId)
    }
  }, [activePostId, onPostDetailClosed])

  return (
    <View style={styles.container}>
      <StoryBarSection ref={storyBarRef} onCharacterClick={handleStoryCharacterClick} />

      <View style={styles.feedList}>
        {loading && items.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
          </View>
        ) : (
          <FeedLayoutList
            items={items}
            onPostClick={handleFeedPostClick}
            onPostLiked={onPostLiked}
            onCharacterClick={handleFeedCharacterClick}
          />
        )}

        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
          </View>
        )}
      </View>

      {storyOpen && storyCharacters.length > 0 && (
        <StoryViewer
          key={storySessionKey}
          characters={storyCharacters}
          initialCharacterIndex={storyInitIndex}
          initialStoryIndex={storyInitStoryIndex}
          onClose={handleStoryClose}
          onRead={handleStoryRead}
          onCharacterFullyRead={handleCharacterFullyRead}
          onNavigateCharacter={(characterId) => {
            navigation.navigate('CharacterDetail', { characterId, source: 'feed' })
          }}
        />
      )}

      {postDetailOpen && postDetail && (
        <FeedPostViewer
          images={postDetail.images}
          characterName={postDetail.characterName}
          characterAvatar={postDetail.characterAvatar}
          content={postDetail.content}
          timeAgo={postDetail.timeAgo}
          isLiked={postDetail.isLiked}
          postId={postDetail.postId}
          impressionId={postDetail.impressionId}
          characterId={postDetail.characterId}
          onLikeChange={(isLiked, likeCount) => {
            if (activePostId) {
              onPostLiked(
                { postId: activePostId } as HomeFeedPost,
                { isLiked, likeCount },
              )
            }
          }}
          onNavigateCharacter={(characterId) => {
            navigation.navigate('CharacterDetail', { characterId, source: 'feed' })
          }}
          onClose={handlePostDetailClose}
        />
      )}

      <Toast message={toast} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingBottom: 16,
  },
  feedList: {
    gap: 16,
  },
  promoWrapper: {
    paddingHorizontal: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
})
