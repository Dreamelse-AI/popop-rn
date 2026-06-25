import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'
import { Image } from 'expo-image'
import { cdnImage } from '@/shared/lib/cdn'

import type { HomeFeedPost } from '@/features/feed/feed-types'
import { useOpenCharacterChat } from '@/features/friendship/hooks/use-open-character-chat'
import { formatCharacterProfilePostTime, postApi } from '@/features/post'

import { ExpandableText } from '@/shared/ui/expandable-text'

const IconLike = cdnImage('assets/feed/icon/like_1.png')
const IconMusic = cdnImage('assets/feed/icon/music_1.png')
const IconMoreImg = cdnImage('assets/feed/icon/moreImg-icon.png')

type PostLikeState = {
  isLiked: boolean
  likeCount: number
}

type FeedPostProps = {
  post: HomeFeedPost
  onImageClick?: (post: HomeFeedPost) => void
  onCharacterClick?: (post: HomeFeedPost) => void
  onLike?: (post: HomeFeedPost, likeState: PostLikeState) => void
}

function LikedHeartIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.247 1.943C9.033 1.15 10.044.667 11.273.667c2.646 0 4.727 2.18 4.727 5.249 0 1.84-.898 3.371-2.557 5.022-.357.356-1.448 1.363-1.498 1.411-.154.148-.32.302-.499.46-.231.205-.466.407-.704.604a49 49 0 01-1.596 1.253 26 26 0 01-.728.534.48.48 0 01-.418 0 26 26 0 01-.728-.534 49 49 0 01-1.596-1.253 32 32 0 01-.704-.604 22 22 0 01-.499-.46c-.049-.048-1.14-1.056-1.497-1.411C1.898 9.287 1 7.757 1 5.916 1 2.847 3.081.667 5.727.667c1.23 0 2.24.483 3.027 1.276.088.089.17.178.246.266.076-.088.158-.177.247-.266z"
        fill="#FF2D55"
      />
    </Svg>
  )
}

export function FeedPost({ post, onImageClick, onCharacterClick, onLike }: FeedPostProps) {
  const { t } = useTranslation()
  const openCharacterChat = useOpenCharacterChat()
  const [liked, setLiked] = useState(post.isLiked)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const likingRef = useRef(false)

  useEffect(() => {
    setLiked(post.isLiked)
    setLikeCount(post.likeCount)
  }, [post.postId, post.isLiked, post.likeCount])

  async function handleLikeClick() {
    if (likingRef.current) return

    const next = !liked
    const prevLiked = liked
    const prevCount = likeCount

    setLiked(next)
    setLikeCount(count => (next ? count + 1 : Math.max(0, count - 1)))

    likingRef.current = true
    try {
      const resp = next
        ? await postApi.likePost(post.postId, post.impressionId)
        : await postApi.unlikePost(post.postId)
      setLikeCount(resp.like_count)
      onLike?.(post, { isLiked: next, likeCount: resp.like_count })
    } catch {
      setLiked(prevLiked)
      setLikeCount(prevCount)
    } finally {
      likingRef.current = false
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onImageClick?.(post)}
        style={styles.imageWrapper}
      >
        {post.imageUrl ? (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.textFallback}>
            <Text style={styles.textFallbackContent} numberOfLines={6}>
              {post.content}
            </Text>
          </View>
        )}
        {post.hasMultipleImages ? (
          <View style={styles.multiImageIconWrapper} pointerEvents="none">
            <Image source={{ uri: IconMoreImg }} style={{width: 34, height: 34}} />
          </View>
        ) : null}
        {post.hasBgm ? (
          <View style={styles.musicIconWrapper} pointerEvents="none">
            <Image source={{ uri: IconMusic }} style={{width: 36, height: 36}} />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.characterRow}>
        <Pressable
          onPress={() => onCharacterClick?.(post)}
          style={styles.characterLeft}
        >
          <View style={styles.characterAvatarWrapper}>
            {post.characterAvatar ? (
              <Image
                source={{ uri: post.characterAvatar }}
                style={styles.characterAvatarImage}
              />
            ) : (
              <View style={styles.characterAvatarFallback}>
                <Text style={styles.characterAvatarInitial}>
                  {post.characterName.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.characterName} numberOfLines={1}>
            {post.characterName}
          </Text>
        </Pressable>
        <Pressable
          style={styles.talkButton}
          onPress={() => void openCharacterChat(post.characterId)}
        >
          <Text style={styles.talkButtonText}>{t('feed.talk')}</Text>
        </Pressable>
      </View>

      {post.imageUrl && post.content ? (
        <View style={styles.contentWrapper}>
          <ExpandableText
            style={styles.contentText}
            expandLabel={t('feed.viewAll')}
          >
            {post.content}
          </ExpandableText>
        </View>
      ) : null}

      <View style={styles.likeRow}>
        <Text style={styles.postTime}>
          {formatCharacterProfilePostTime(post.publishedAtMs)}
        </Text>
        <Pressable
          onPress={() => void handleLikeClick()}
          style={styles.likeButton}
          accessibilityLabel="点赞"
        >
          {liked ? (
            <LikedHeartIcon />
          ) : (
            <Image source={{ uri: IconLike }} style={{width: 16, height: 16}} />
          )}
        </Pressable>
      </View>

      <View style={styles.divider} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageWrapper: {
    width: '100%',
    height: 292,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '133.33%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  textFallback: {
    flex: 1,
    backgroundColor: '#1a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  textFallbackContent: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  multiImageIconWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 12,
  },
  musicIconWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 12,
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  characterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  characterAvatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  characterAvatarImage: {
    width: 36,
    height: 36,
  },
  characterAvatarFallback: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterAvatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.4)',
  },
  characterName: {
    fontSize: 20,
    lineHeight: 21,
    fontFamily: 'Black Han Sans',
    color: '#000000',
    flex: 1,
  },
  talkButton: {
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  talkButtonText: {
    fontSize: 12,
    fontFamily: 'Black Han Sans',
    lineHeight: 12,
    color: '#000000',
  },
  contentWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contentText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: 'rgba(0,0,0,0.8)',
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  postTime: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(0,0,0,0.5)',
  },
  likeButton: {
    padding: 4,
  },
  divider: {
    height: 8,
    backgroundColor: '#f0f0f0',
  },
})
