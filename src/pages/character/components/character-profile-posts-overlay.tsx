import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator, Modal, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

import type { CharacterPostView } from '@/features/post/post-mapper'
import { formatCharacterProfilePostTime, postReactionApi } from '@/features/post'

import IconBack from '@/shared/assets/character/add-character/icon-back.svg'
import { Image } from 'expo-image'

type CharacterProfilePostsOverlayProps = {
  characterName: string
  posts: CharacterPostView[]
  initialPostId?: string
  loadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onClose: () => void
}

function PostFeedItem({
  post,
  isLiked,
  onToggleLike,
}: {
  post: CharacterPostView
  isLiked: boolean
  onToggleLike: () => void
}) {
  return (
    <View style={styles.postItem}>
      {post.images.length > 0 && (
        <View style={styles.postImageContainer}>
          <Image source={{ uri: post.images[0] }} style={styles.postImage} />
          {post.images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>1/{post.images.length}</Text>
            </View>
          )}
        </View>
      )}

      {post.content ? (
        <View style={styles.postContent}>
          <Text style={styles.postContentText}>{post.content}</Text>
        </View>
      ) : null}

      <View style={styles.postFooter}>
        <Text style={styles.postTime}>
          {formatCharacterProfilePostTime(post.publishedAtMs)}
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
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onClose,
}: CharacterProfilePostsOverlayProps) {
  const insets = useSafeAreaInsets()
  const pendingLikeRef = useRef<Set<string>>(new Set())
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(posts.map(post => [post.postId, post.isLiked])),
  )

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

  const handleScroll = useCallback((event: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
    if (!onLoadMore || !hasMore || loadingMore) return
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const remaining = contentSize.height - layoutMeasurement.height - contentOffset.y
    if (remaining < 400) {
      void onLoadMore()
    }
  }, [hasMore, loadingMore, onLoadMore])

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.backButton} accessibilityLabel="返回">
            <IconBack width={36} height={36} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{characterName}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          showsVerticalScrollIndicator={false}
        >
          {posts.map(post => (
            <PostFeedItem
              key={post.postId}
              post={post}
              isLiked={likedMap[post.postId] ?? post.isLiked}
              onToggleLike={() => void toggleLike(post.postId)}
            />
          ))}

          {loadingMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 56,
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
  scrollContent: {
    gap: 12,
    paddingBottom: 32,
  },
  postItem: {
    backgroundColor: '#ffffff',
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 390 / 292,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
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
