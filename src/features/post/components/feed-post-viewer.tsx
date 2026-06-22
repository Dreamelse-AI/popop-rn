import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions, Modal, Animated, Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg'

import { MusicControl } from './music-control'
import { postApi } from '../post-api'
import { useSendComment } from '@/features/comment'
import { StoryFooter } from '@/features/story/story-footer'
import { ShareSheet, type ShareContent } from '@/features/share'
import { useImageBrightness } from '@/shared/hooks/use-image-brightness'
import { ViewerExpandableText } from '@/shared/components/viewer-expandable-text'
import { Image } from 'expo-image'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type FeedPostViewerProps = {
  images: string[]
  characterName: string
  characterAvatar: string
  content: string
  timeAgo: string
  musicName?: string
  musicUrl?: string
  isLiked?: boolean
  postId?: string
  impressionId?: string
  characterId?: string
  onLikeChange?: (isLiked: boolean, likeCount: number) => void
  onNavigateCharacter?: (characterId: string) => void
  onClose: () => void
}

export function FeedPostViewer({
  images,
  characterName,
  characterAvatar,
  content,
  timeAgo,
  musicName,
  musicUrl,
  isLiked = false,
  postId,
  impressionId,
  characterId,
  onLikeChange,
  onNavigateCharacter,
  onClose,
}: FeedPostViewerProps) {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [modalVisible, setModalVisible] = useState(true)

  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      setModalVisible(true)
    })
    return () => { unsubFocus() }
  }, [navigation])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const heartScale = useRef(new Animated.Value(0)).current
  const heartOpacity = useRef(new Animated.Value(0)).current
  const heartbreakLeftX = useRef(new Animated.Value(0)).current
  const heartbreakRightX = useRef(new Animated.Value(0)).current
  const heartbreakOpacity = useRef(new Animated.Value(0)).current

  const currentImage = images[currentIndex] || ''
  const hasImages = images.length > 0
  const themeBrightness = useImageBrightness(currentImage)
  const isDark = themeBrightness === 'dark'
  const textColor = isDark ? '#ffffff' : '#000000'
  const textMutedColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
  const iconStroke = isDark ? '#ffffff' : '#000000'

  const showHeartAnimation = useCallback(() => {
    heartScale.setValue(0.3)
    heartOpacity.setValue(1)
    Animated.parallel([
      Animated.spring(heartScale, { toValue: 1.2, useNativeDriver: true }),
      Animated.timing(heartOpacity, { toValue: 0, duration: 800, delay: 300, useNativeDriver: true }),
    ]).start()
  }, [heartScale, heartOpacity])

  const showHeartbreakAnimation = useCallback(() => {
    heartbreakLeftX.setValue(0)
    heartbreakRightX.setValue(0)
    heartbreakOpacity.setValue(1)
    Animated.parallel([
      Animated.timing(heartbreakLeftX, { toValue: -20, duration: 500, useNativeDriver: true }),
      Animated.timing(heartbreakRightX, { toValue: 20, duration: 500, useNativeDriver: true }),
      Animated.timing(heartbreakOpacity, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start()
  }, [heartbreakLeftX, heartbreakRightX, heartbreakOpacity])

  const handleLike = useCallback(
    async (liked: boolean) => {
      if (!postId) return

      if (liked) {
        showHeartAnimation()
      } else {
        showHeartbreakAnimation()
      }

      const resp = liked
        ? await postApi.likePost(postId, impressionId)
        : await postApi.unlikePost(postId)
      onLikeChange?.(liked, resp.like_count)
    },
    [postId, impressionId, onLikeChange, showHeartAnimation, showHeartbreakAnimation],
  )

  const handleNavigateCharacter = useCallback(() => {
    if (!characterId) return
    setModalVisible(false)
    onNavigateCharacter?.(characterId)
  }, [characterId, onNavigateCharacter])

  const shareContent: ShareContent = {
    kind: 'post',
    id: postId ?? '',
    characterName,
    content,
    imageContent: images.length > 0 ? `${images.length} 张图片` : '',
  }

  const commentTarget = characterId ? { kind: 'post' as const, characterId } : null

  const { sendComment } = useSendComment(commentTarget)

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / SCREEN_WIDTH)
    setCurrentIndex(index)
  }, [])

  return (
    <Modal visible={modalVisible} animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top }]} onTouchStart={() => Keyboard.dismiss()}>
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
        <Pressable style={styles.characterRow} onPress={handleNavigateCharacter}>
          <View style={styles.characterInfo}>
            <View style={styles.characterAvatarWrapper}>
              <Image source={{ uri: characterAvatar }} style={styles.characterAvatarImage} />
            </View>
            <Text style={[styles.characterName, { color: textColor }]}>{characterName}</Text>
          </View>
          <Text style={[styles.timeAgo, { color: textMutedColor }]}>{timeAgo}</Text>
        </Pressable>

        {/* Content text */}
        {content ? (
          <View style={styles.contentWrapper}>
            <ViewerExpandableText
              style={[styles.contentText, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }]}
              expandLabel={t('post.expandText')}
              collapseLabel={t('post.collapseText')}
              labelColor={textMutedColor}
              text={content}
            />
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
                  <View style={styles.carouselImageWrapper}>
                    <Image
                      source={{ uri: img }}
                      style={styles.carouselImage}
                      contentFit="cover"
                    />
                  </View>
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
            <MusicControl musicName={musicName} musicUrl={musicUrl} isDark={isDark} />
          </View>
        )}

        {/* Footer */}
        <StoryFooter
          key={postId}
          initialLiked={isLiked}
          isDark={isDark}
          onLike={handleLike}
          onReply={text => sendComment(text)}
        />

        {/* Heart animation overlay */}
        <Animated.View
          pointerEvents="none"
          style={[styles.animationOverlay, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]}
        >
          <Svg width={80} height={80} viewBox="0 0 24 24" fill={textColor}>
            <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </Svg>
        </Animated.View>

        {/* Heartbreak animation overlay */}
        <Animated.View pointerEvents="none" style={[styles.animationOverlay, { opacity: heartbreakOpacity, flexDirection: 'row' }]}>
          <Animated.View style={{ transform: [{ translateX: heartbreakLeftX }, { rotate: '-15deg' }] }}>
            <Svg width={40} height={70} viewBox="0 0 12 22" fill={textColor}>
              <Path d="M12 19.35l-1.45-1.32C5.4 13.36 2 10.28 2 6.5 2 3.42 4.42 1 7.5 1c1.74 0 3.41.81 4.5 2.09V19.35z" />
            </Svg>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateX: heartbreakRightX }, { rotate: '15deg' }] }}>
            <Svg width={40} height={70} viewBox="12 0 12 22" fill={textColor}>
              <Path d="M12 19.35V3.09C13.09 1.81 14.76 1 16.5 1 19.58 1 22 3.42 22 6.5c0 3.78-3.4 6.86-8.55 11.54L12 19.35z" />
            </Svg>
          </Animated.View>
        </Animated.View>
      </View>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} content={shareContent} />
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
  carouselImageWrapper: {
    width: SCREEN_WIDTH - 24,
    flex: 1,
    maxHeight: 480,
    borderRadius: 30,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
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
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
