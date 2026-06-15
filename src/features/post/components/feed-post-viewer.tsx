import { useCallback, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions, Modal } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg'

import { MusicControl } from './music-control'
import { postApi } from '../post-api'
import { useSendComment } from '@/features/comment'
import { StoryFooter } from '@/features/story/story-footer'
import { ShareSheet, type ShareContent } from '@/features/share'
import { useImageBrightness } from '@/shared/hooks/use-image-brightness'
import { Image } from 'expo-image'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type FeedPostViewerProps = {
  images: string[]
  characterName: string
  characterAvatar: string
  content: string
  timeAgo: string
  musicName?: string
  isLiked?: boolean
  postId?: string
  impressionId?: string
  characterId?: string
  onLikeChange?: (isLiked: boolean, likeCount: number) => void
  onClose: () => void
}

export function FeedPostViewer({
  images,
  characterName,
  characterAvatar,
  content,
  timeAgo,
  musicName,
  isLiked = false,
  postId,
  impressionId,
  characterId,
  onLikeChange,
  onClose,
}: FeedPostViewerProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const [commentToast, setCommentToast] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const currentImage = images[currentIndex] || ''
  const hasImages = images.length > 0
  const themeBrightness = useImageBrightness(currentImage)
  const isDark = themeBrightness === 'dark'
  const textColor = isDark ? '#ffffff' : '#000000'
  const textMutedColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
  const iconStroke = isDark ? '#ffffff' : '#000000'

  const handleLike = useCallback(
    async (liked: boolean) => {
      if (!postId) return

      const resp = liked
        ? await postApi.likePost(postId, impressionId)
        : await postApi.unlikePost(postId)
      onLikeChange?.(liked, resp.like_count)
    },
    [postId, impressionId, onLikeChange],
  )

  const shareContent: ShareContent = {
    kind: 'post',
    id: postId ?? '',
    characterName,
    content,
    imageContent: images.length > 0 ? `${images.length} 张图片` : '',
  }

  const commentTarget = characterId ? { kind: 'post' as const, characterId } : null

  const handleCommentSent = useCallback(() => {
    setCommentToast(true)
    setTimeout(() => setCommentToast(false), 1800)
  }, [])

  const { sendComment } = useSendComment(commentTarget, handleCommentSent)

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / SCREEN_WIDTH)
    setCurrentIndex(index)
  }, [])

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Blurred background */}
        {hasImages && (
          <Image
            source={{ uri: currentImage }}
            style={styles.blurredBg}
            blurRadius={40}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton} accessibilityLabel="Close">
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path d="M15 5L5 15M5 5l10 10" stroke={iconStroke} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </Pressable>
          <Pressable onPress={() => setShareOpen(true)} style={styles.headerButton} accessibilityLabel="Share">
            <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
              <G clipPath="url(#clip_share_fpv)">
                <Path
                  d="M20.7283 9.75282C20.7283 9.30643 21.2688 9.08378 21.5832 9.40064L28.6695 16.5421C29.0566 16.9322 29.0563 17.5616 28.6689 17.9514L21.583 25.0815C21.2684 25.398 20.7283 25.1753 20.7283 24.7291V21.409C20.7283 21.1543 20.541 20.9428 20.2865 20.9317C18.6355 20.8592 12.7018 20.9567 8.37591 25.6372C8.02355 26.0185 7.39112 25.749 7.51791 25.2456C8.45058 21.5422 11.447 13.7885 20.2212 13.5002C20.4971 13.4912 20.7283 13.2681 20.7283 12.992V9.75282Z"
                  fill={iconStroke}
                />
              </G>
              <Defs>
                <ClipPath id="clip_share_fpv">
                  <Rect width={22.3633} height={20} fill="white" x={7} y={8} />
                </ClipPath>
              </Defs>
            </Svg>
          </Pressable>
        </View>

        {/* Character info */}
        <View style={styles.characterRow}>
          <View style={styles.characterInfo}>
            <View style={styles.characterAvatarWrapper}>
              <Image source={{ uri: characterAvatar }} style={styles.characterAvatarImage} />
            </View>
            <Text style={[styles.characterName, { color: textColor }]}>{characterName}</Text>
          </View>
          <Text style={[styles.timeAgo, { color: textMutedColor }]}>{timeAgo}</Text>
        </View>

        {/* Content text */}
        {content ? (
          <View style={styles.contentWrapper}>
            <Text style={[styles.contentText, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }]} numberOfLines={2}>
              {content}
            </Text>
          </View>
        ) : null}

        {/* Center area — image carousel or text card */}
        <View style={styles.centerArea}>
          {hasImages ? (
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              style={styles.carousel}
            >
              {images.map((img, idx) => (
                <View key={idx} style={styles.carouselItem}>
                  <Image
                    source={{ uri: img }}
                    style={styles.carouselImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.textCard}>
              <Text style={styles.textCardContent}>{content}</Text>
            </View>
          )}

          {/* Page dots */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, idx === currentIndex ? styles.dotActive : styles.dotInactive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Music control */}
        {musicName && (
          <View style={styles.musicRow}>
            <MusicControl musicName={musicName} />
          </View>
        )}

        {/* Footer */}
        <StoryFooter
          key={postId}
          initialLiked={isLiked}
          isDark={isDark}
          onLike={handleLike}
          onReply={text => {
            void sendComment(text)
          }}
        />
      </View>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} content={shareContent} />

      {commentToast && (
        <View style={styles.commentToastWrapper}>
          <View style={styles.commentToast}>
            <Text style={styles.commentToastText}>{t('post.commentSent')}</Text>
          </View>
        </View>
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  blurredBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: [{ scale: 1.1 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  characterAvatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  characterAvatarImage: {
    width: 36,
    height: 36,
  },
  characterName: {
    fontSize: 20,
    fontWeight: '700',
  },
  timeAgo: {
    fontSize: 12,
  },
  contentWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contentText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carousel: {
    flex: 1,
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  carouselImage: {
    width: SCREEN_WIDTH - 24,
    height: '100%',
    maxHeight: 480,
    borderRadius: 30,
  },
  textCard: {
    width: SCREEN_WIDTH - 24,
    height: 320,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#1a1a2e',
  },
  textCardContent: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 28,
    color: '#ffffff',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    bottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#ffffff',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  musicRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
  },
  commentToastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 112,
    alignItems: 'center',
  },
  commentToast: {
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentToastText: {
    fontSize: 14,
    color: '#ffffff',
  },
})
