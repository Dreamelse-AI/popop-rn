import { useCallback, useEffect, useRef, useState } from 'react'
import { View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { cdnImage } from '@/shared/lib/cdn'

import type { CharacterPostView } from '@/features/post/post-mapper'
import { formatCharacterProfilePostTime, postReactionApi, usePostBgmPlayer } from '@/features/post'
import { characterMainAssets } from '@/shared/assets/character/main'
import { PopImage } from '@/shared/ui/pop-image'

const IconBack = cdnImage('assets/icon-back.png')
const IconMusic = cdnImage('assets/character/main/character-music.png')

import type { CharacterProfileCellAnchor } from './character-profile-posts-list'

const HEADER_HEIGHT = 56
const BGM_SPIN_DURATION_MS = 3000

type CharacterProfilePostsOverlayProps = {
  characterName: string
  posts: CharacterPostView[]
  initialPostId?: string
  anchorRect?: CharacterProfileCellAnchor
  loadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onClose: () => void
}

function SpinningMusicIcon({ spinning }: { spinning: boolean }) {
  const spinAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!spinning) {
      spinAnim.setValue(0)
      return
    }

    const animation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: BGM_SPIN_DURATION_MS,
        useNativeDriver: true,
      }),
    )
    animation.start()
    return () => animation.stop()
  }, [spinAnim, spinning])

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Image source={{ uri: IconMusic }} style={{width: 16, height: 16}} />
    </Animated.View>
  )
}

function PostImageCarousel({
  images,
  hasBgm,
  isPlaying,
  onBgmClick,
}: {
  images: string[]
  hasBgm: boolean
  isPlaying: boolean
  onBgmClick: () => void
}) {
  const { width: screenWidth } = useWindowDimensions()
  const [currentIndex, setCurrentIndex] = useState(0)
  const hasMultipleImages = images.length > 1

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasMultipleImages) return
      const offsetX = event.nativeEvent.contentOffset.x
      const index = Math.min(
        images.length - 1,
        Math.max(0, Math.round(offsetX / screenWidth)),
      )
      setCurrentIndex(index)
    },
    [hasMultipleImages, images.length, screenWidth],
  )

  if (images.length === 0) return null

  return (
    <View style={styles.postImageContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={hasMultipleImages}
        onMomentumScrollEnd={handleScroll}
        style={styles.carousel}
      >
        {images.map((image, index) => (
          <View key={`${image}-${index}`} style={{ width: screenWidth }}>
            <PopImage uri={image} style={styles.postImage} contentFit="cover" />
          </View>
        ))}
      </ScrollView>

      {hasMultipleImages ? (
        <View style={styles.imageCounter} pointerEvents="none">
          <Text style={styles.imageCounterText}>
            {currentIndex + 1}/{images.length}
          </Text>
        </View>
      ) : null}

      {hasBgm ? (
        <Pressable
          onPress={onBgmClick}
          style={styles.bgmButton}
          accessibilityLabel={isPlaying ? '正在播放背景音乐' : '播放背景音乐'}
        >
          <SpinningMusicIcon spinning={isPlaying} />
        </Pressable>
      ) : null}
    </View>
  )
}

function PostFeedItem({
  post,
  isLiked,
  isBgmPlaying,
  onToggleLike,
  onBgmClick,
}: {
  post: CharacterPostView
  isLiked: boolean
  isBgmPlaying: boolean
  onToggleLike: () => void
  onBgmClick: () => void
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.postItem}>
      <PostImageCarousel
        images={post.images}
        hasBgm={post.hasBgm}
        isPlaying={isBgmPlaying}
        onBgmClick={onBgmClick}
      />

      {post.content ? (
        <View style={styles.postContent}>
          <Text style={styles.postContentText}>{post.content}</Text>
        </View>
      ) : null}

      <View style={styles.postFooter}>
        <Text style={styles.postTime}>
          {formatCharacterProfilePostTime(post.publishedAtMs, t)}
        </Text>
        <Pressable onPress={onToggleLike} style={styles.likeButton} accessibilityLabel={isLiked ? '取消喜欢' : '喜欢'}>
          <Svg width={22} height={20} viewBox="0 0 22 20" fill={isLiked ? '#FF2D55' : 'none'}>
            <Path
              d="M11 18s-7-4.35-9-8C0 6.5 2 3 5.5 3 7.36 3 9 4 11 6c2-2 3.64-3 5.5-3C20 3 22 6.5 20 10c-2 3.65-9 8-9 8z"
              stroke={isLiked ? '#FF2D55' : 'rgba(0,0,0,0.3)'}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </View>
    </View>
  )
}

export function CharacterProfilePostsOverlay({
  characterName,
  posts,
  initialPostId,
  anchorRect,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onClose,
}: CharacterProfilePostsOverlayProps) {
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const contentRef = useRef<View>(null)
  const postRefs = useRef<Record<string, View | null>>({})
  const pendingLikeRef = useRef<Set<string>>(new Set())
  const { playingPostId, play: playBgm, stop: stopBgm } = usePostBgmPlayer()
  const [contentReady, setContentReady] = useState(false)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(posts.map(post => [post.postId, post.isLiked])),
  )

  const headerOffset = HEADER_HEIGHT + insets.top

  useEffect(() => {
    return () => {
      stopBgm()
    }
  }, [stopBgm])

  useEffect(() => {
    setContentReady(false)
  }, [initialPostId, anchorRect])

  useEffect(() => {
    setLikedMap(prev => {
      const next = { ...prev }
      for (const post of posts) {
        if (!(post.postId in next)) {
          next[post.postId] = post.isLiked
        }
      }
      return next
    })
  }, [posts])

  const scrollToInitialPost = useCallback(() => {
    if (!initialPostId) {
      setContentReady(true)
      return
    }

    const postView = postRefs.current[initialPostId]
    const contentView = contentRef.current
    if (!postView || !contentView) {
      setContentReady(true)
      return
    }

    postView.measureLayout(
      contentView,
      (_x, y) => {
        const scrollY = anchorRect
          ? Math.max(0, y + headerOffset - anchorRect.y)
          : Math.max(0, y)
        scrollRef.current?.scrollTo({ y: scrollY, animated: false })
        setContentReady(true)
      },
      () => setContentReady(true),
    )
  }, [anchorRect, headerOffset, initialPostId])

  const toggleLike = useCallback(async (postId: string) => {
    if (pendingLikeRef.current.has(postId)) return

    let wasLiked = false
    setLikedMap(prev => {
      wasLiked = prev[postId] ?? false
      return { ...prev, [postId]: !wasLiked }
    })

    pendingLikeRef.current.add(postId)

    try {
      if (wasLiked) {
        await postReactionApi.removeLike(postId)
      } else {
        await postReactionApi.addLike(postId)
      }
    } catch (e) {
      setLikedMap(prev => ({ ...prev, [postId]: wasLiked }))
      console.error('[CharacterProfilePostsOverlay] toggle like failed:', e)
    } finally {
      pendingLikeRef.current.delete(postId)
    }
  }, [])

  const handleBgmClick = useCallback(
    (post: CharacterPostView) => {
      if (!post.bgmUrl) return
      playBgm(post.postId, post.bgmUrl)
    },
    [playBgm],
  )

  const handleClose = useCallback(() => {
    stopBgm()
    onClose()
  }, [onClose, stopBgm])

  const handleScroll = useCallback((event: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
    if (!onLoadMore || !hasMore || loadingMore) return
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const remaining = contentSize.height - layoutMeasurement.height - contentOffset.y
    if (remaining < 400) {
      void onLoadMore()
    }
  }, [hasMore, loadingMore, onLoadMore])

  return (
    <View style={[styles.overlay, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.backButton} accessibilityLabel="返回">
          <Image source={{ uri: IconBack }} style={{width: 36, height: 36}} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{characterName}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={[styles.scrollView, !contentReady && styles.scrollHidden]}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
      >
        <View ref={contentRef} collapsable={false} onLayout={scrollToInitialPost}>
          {posts.map(post => (
            <View
              key={post.postId}
              ref={node => {
                postRefs.current[post.postId] = node
              }}
              collapsable={false}
            >
              <PostFeedItem
                post={post}
                isLiked={likedMap[post.postId] ?? post.isLiked}
                isBgmPlaying={playingPostId === post.postId}
                onToggleLike={() => void toggleLike(post.postId)}
                onBgmClick={() => handleBgmClick(post)}
              />
            </View>
          ))}

          {loadingMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    elevation: 50,
    backgroundColor: '#ffffff',
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    maxWidth: '60%',
  },
  scrollView: {
    flex: 1,
  },
  scrollHidden: {
    opacity: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  postItem: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 390 / 292,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  carousel: {
    flex: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    right: 12,
    top: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(48,48,48,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  bgmButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(48,48,48,0.9)',
  },
  postContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  postContentText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: 'rgba(0,0,0,0.8)',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    gap: 8,
  },
  postTime: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
  },
  likeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMore: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
})
