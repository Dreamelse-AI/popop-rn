import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, Modal, StyleSheet, Animated, Keyboard, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Svg, { Path } from 'react-native-svg'

import type { StoryCharacter } from './story-types'
import { StoryFooter } from './story-footer'
import { storyApi } from './story-api'
import { useStoryReadStore } from './story-store'
import { useStorySwipe } from './use-story-swipe'
import { useSendComment, type SendCommentTarget } from '@/features/comment'
import { useAutoPlay } from '@/features/post/hooks/use-auto-play'
import { ProgressBar } from '@/features/post/components/progress-bar'
import { MusicControl, type MusicControlHandle } from '@/features/post/components/music-control'
import { Image } from 'expo-image'
import { preload as preloadAudio } from 'expo-audio'
import { useImageBrightness } from '@/shared/hooks/use-image-brightness'
import { ViewerExpandableText } from '@/shared/components/viewer-expandable-text'

type StoryViewerProps = {
  characters: StoryCharacter[]
  initialCharacterIndex: number
  initialStoryIndex?: number
  onClose: () => void
  onRead?: (characterId: string, storyId: string) => void
  onCharacterFullyRead?: (characterId: string) => void
  onNavigateCharacter?: (characterId: string) => void
  paused?: boolean
}


function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  const m = date.getMonth() + 1
  const d = date.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  if (days < 365) return `${m}월 ${d}일 ${hh}:${mm}`
  return `${date.getFullYear()}년 ${m}월 ${d}일 ${hh}:${mm}`
}

function computeInitialStoryIndex(
  character: StoryCharacter,
  lastReadStoryId: string | undefined,
  isStoryRead: (storyId: string) => boolean,
): number {
  const { stories } = character
  if (!stories.length) return 0
  const firstUnreadIndex = stories.findIndex(s => !isStoryRead(s.id))
  if (firstUnreadIndex !== -1) return firstUnreadIndex
  if (lastReadStoryId) {
    const lastReadIdx = stories.findIndex(s => s.id === lastReadStoryId)
    if (lastReadIdx !== -1 && lastReadIdx < stories.length - 1) return lastReadIdx + 1
  }
  return 0
}

const DRAG_CLOSE_THRESHOLD = 150

export function StoryViewer({
  characters,
  initialCharacterIndex,
  initialStoryIndex,
  onClose,
  onRead,
  onCharacterFullyRead,
  onNavigateCharacter,
  paused: pausedProp = false,
}: StoryViewerProps) {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [modalVisible, setModalVisible] = useState(true)
  const { isStoryRead, getLastReadStory, setLastReadStory, markStoryRead } = useStoryReadStore()

  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      setModalVisible(true)
    })
    return () => { unsubFocus() }
  }, [navigation])

  const initialStoryIdx = useMemo(() => {
    const char = characters[initialCharacterIndex]
    if (!char) return 0
    if (initialStoryIndex != null) {
      return Math.min(Math.max(0, initialStoryIndex), Math.max(0, char.stories.length - 1))
    }
    const lastReadId = getLastReadStory(char.id)
    return computeInitialStoryIndex(char, lastReadId, isStoryRead)
  }, [])

  const [charIndex, setCharIndex] = useState(initialCharacterIndex)
  const [inputFocused, setInputFocused] = useState(false)
  const [isTapPaused, setIsTapPaused] = useState(false)
  const [isMusicPausedByTap, setIsMusicPausedByTap] = useState(false)
  const [textPausedTimer, setTextPausedTimer] = useState(false)
  const [isDraggingDown, setIsDraggingDown] = useState(false)
  const [textExpanded, setTextExpanded] = useState(false)
  const [musicExpanded, setMusicExpanded] = useState(false)
  // 对齐 web：bgmLoading 初始 false，由 MusicControl 的 onLoadingChange 驱动
  const [bgmLoading, setBgmLoading] = useState(false)
  const reportedStoryRef = useRef<string | null>(null)
  const musicRef = useRef<MusicControlHandle>(null)
  const scrollRef = useRef<ScrollView>(null)

  // Heart animation
  const heartScale = useRef(new Animated.Value(0)).current
  const heartOpacity = useRef(new Animated.Value(0)).current
  const heartbreakOpacity = useRef(new Animated.Value(0)).current
  const heartbreakLeft = useRef(new Animated.Value(0)).current
  const heartbreakRight = useRef(new Animated.Value(0)).current

  // Drag-to-close
  const dragY = useRef(new Animated.Value(0)).current
  const dragStartY = useRef(0)
  const isDragActive = useRef(false)

  const currentChar = characters[charIndex]
  const totalStories = currentChar?.stories.length ?? 0

  const handleAllCompleteRef = useRef<() => void>(() => {})

  const handleAllComplete = useCallback(() => {
    handleAllCompleteRef.current()
  }, [])

  const { currentIndex, progress, pause, resume, goTo, goNext, goPrev } = useAutoPlay({
    totalSlides: totalStories,
    duration: 5000,
    initialIndex: initialStoryIdx,
    externalPaused: bgmLoading,
    onComplete: handleAllComplete,
  })

  handleAllCompleteRef.current = () => {
    if (!currentChar) return
    onCharacterFullyRead?.(currentChar.id)
    if (charIndex < characters.length - 1) {
      const nextChar = characters[charIndex + 1]
      const targetStory = nextChar?.stories[0]
      if (targetStory?.musicUrl) setBgmLoading(true)
      setCharIndex(charIndex + 1)
      goTo(0)
    } else {
      onClose()
    }
  }

  const currentStory = currentChar?.stories[currentIndex]

  // 同步：story 切换时立即在渲染阶段将 bgmLoading 设 true（而非 useEffect，避免一帧延迟让进度条偷跑）
  const prevStoryIdRef = useRef(currentStory?.id)
  if (currentStory?.id !== prevStoryIdRef.current) {
    prevStoryIdRef.current = currentStory?.id
    if (currentStory?.musicUrl && !bgmLoading) {
      setBgmLoading(true)
    } else if (!currentStory?.musicUrl && bgmLoading) {
      setBgmLoading(false)
    }
  }

  const currentImageUrl = currentStory?.images?.[0]
  const brightness = useImageBrightness(currentImageUrl)
  const isDark = brightness === 'dark'
  const themeColor = isDark ? '#ffffff' : '#000000'
  const themeColorSoft = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
  const themeColorText = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'

  // 进度条暂停条件：用户点击暂停 或 展开全文暂停
  const shouldPauseTimer = pausedProp || inputFocused || isTapPaused || textPausedTimer || isDraggingDown || !modalVisible || bgmLoading
  // 音乐暂停条件：独立的 isMusicPausedByTap（用户可通过胶囊单独恢复音乐）
  const shouldPauseMusic = pausedProp || inputFocused || isMusicPausedByTap || isDraggingDown || !modalVisible

  useEffect(() => {
    if (shouldPauseTimer) {
      pause()
    } else {
      resume()
    }
  }, [shouldPauseTimer, pause, resume])

  useEffect(() => {
    if (shouldPauseMusic) {
      musicRef.current?.pause()
    } else {
      musicRef.current?.resume()
    }
  }, [shouldPauseMusic])

  // bgmLoading 已在渲染阶段同步处理，此处无需 effect

  const prevCharIndexRef = useRef(charIndex)
  const targetStoryIndexOnCharSwitch = useRef(0)
  useEffect(() => {
    if (charIndex !== prevCharIndexRef.current) {
      prevCharIndexRef.current = charIndex
      goTo(targetStoryIndexOnCharSwitch.current)
      targetStoryIndexOnCharSwitch.current = 0
    }
  }, [charIndex, goTo])

  useEffect(() => {
    if (!currentChar || !currentStory) return
    const key = `${currentChar.id}:${currentStory.id}`
    if (reportedStoryRef.current === key) return
    reportedStoryRef.current = key
    markStoryRead(currentStory.id)
    setLastReadStory(currentChar.id, currentStory.id)
    onRead?.(currentChar.id, currentStory.id)
  }, [currentChar, currentStory, onRead, setLastReadStory, markStoryRead])

  // Reset textExpanded on story change
  useEffect(() => {
    setTextExpanded(false)
    setIsTapPaused(false)
    setIsMusicPausedByTap(false)
    setTextPausedTimer(false)
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [currentStory?.id])

  // 文字展开态变化：展开/收起都只暂停进度条（不影响音乐），需用户点屏幕才恢复
  const handleTextExpandChange = useCallback((expanded: boolean) => {
    setTextExpanded(expanded)
    setTextPausedTimer(true)
    if (!expanded) scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [])

  // Prefetch adjacent story images for faster display
  useEffect(() => {
    const stories = currentChar?.stories ?? []
    const urls = [
      stories[currentIndex + 1]?.images?.[0],
      stories[currentIndex - 1]?.images?.[0],
    ].filter((u): u is string => !!u)
    if (urls.length) Image.prefetch(urls)
    // 预加载当前角色内下一条 story 的 BGM，减少切换等待
    const nextBgm = stories[currentIndex + 1]?.musicUrl
    if (nextBgm) void Promise.resolve(preloadAudio({ uri: nextBgm })).catch(() => {})
  }, [currentChar, currentIndex])

  // 预加载下一个角色的 story（第一段 BGM + 第一张图），避免跨角色切换时等待下载
  useEffect(() => {
    const nextStory = characters[charIndex + 1]?.stories?.[0]
    if (!nextStory) return
    const nextImg = nextStory.images?.[0]
    if (nextImg) Image.prefetch(nextImg)
    const nextUrl = nextStory.musicUrl
    if (!nextUrl) return
    // preload 是异步的，吞掉 rejection 避免未捕获错误
    void Promise.resolve(preloadAudio({ uri: nextUrl })).catch(() => {})
  }, [characters, charIndex])

  const animateHeart = useCallback(() => {
    heartScale.setValue(0)
    heartOpacity.setValue(1)
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.2, useNativeDriver: true }),
      Animated.timing(heartOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start()
  }, [heartScale, heartOpacity])

  const animateHeartbreak = useCallback(() => {
    heartbreakOpacity.setValue(1)
    heartbreakLeft.setValue(0)
    heartbreakRight.setValue(0)
    Animated.parallel([
      Animated.timing(heartbreakLeft, { toValue: -12, duration: 400, useNativeDriver: true }),
      Animated.timing(heartbreakRight, { toValue: 12, duration: 400, useNativeDriver: true }),
      Animated.timing(heartbreakOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [heartbreakOpacity, heartbreakLeft, heartbreakRight])

  const handleLike = useCallback((isLiked: boolean) => {
    if (!currentStory) return
    if (isLiked) {
      animateHeart()
      void storyApi.likeStory(currentStory.id).catch(() => {})
    } else {
      animateHeartbreak()
      void storyApi.unlikeStory(currentStory.id).catch(() => {})
    }
  }, [currentStory, animateHeart, animateHeartbreak])

  // 向前切换：当前角色内先后退，到第一张时切到上一个角色的最后一张
  const handleGoPrev = useCallback(() => {
    // 滑动切换时立即收起全文
    if (textExpanded) {
      setTextExpanded(false)
      setTextPausedTimer(false)
      scrollRef.current?.scrollTo({ y: 0, animated: false })
    }
    if (currentIndex > 0) {
      goPrev()
    } else if (charIndex > 0) {
      const prevCharIndex = charIndex - 1
      const prevChar = characters[prevCharIndex]
      const lastStoryIndex = prevChar ? Math.max(0, prevChar.stories.length - 1) : 0
      const targetStory = prevChar?.stories[lastStoryIndex]
      // 跨角色切换：提前设 bgmLoading 防止进度条偷跑
      if (targetStory?.musicUrl) setBgmLoading(true)
      targetStoryIndexOnCharSwitch.current = lastStoryIndex
      setCharIndex(prevCharIndex)
      goTo(lastStoryIndex)
    } else {
      // 已是第一个角色的第一条：重新播放当前 story，reset 所有状态
      setTextExpanded(false)
      setIsTapPaused(false)
      setIsMusicPausedByTap(false)
      setTextPausedTimer(false)
      scrollRef.current?.scrollTo({ y: 0, animated: false })
      goTo(0)
    }
  }, [currentIndex, charIndex, characters, goPrev, goTo, textExpanded])

  // 向后切换：与自动播放完成时共用同一套跨角色/关闭边界
  const handleGoNext = useCallback(() => {
    // 滑动切换时立即收起全文
    if (textExpanded) {
      setTextExpanded(false)
      setTextPausedTimer(false)
      scrollRef.current?.scrollTo({ y: 0, animated: false })
    }
    if (currentIndex < totalStories - 1) {
      goNext()
    } else {
      handleAllComplete()
    }
  }, [currentIndex, totalStories, goNext, handleAllComplete, textExpanded])

  // 点屏幕：切换暂停/播放（对齐 web handleImageClick）。聚焦/音乐展开时先处理对应收起。
  const handleTap = useCallback(() => {
    if (inputFocused) {
      Keyboard.dismiss()
      return
    }
    if (musicExpanded) {
      setMusicExpanded(false)
      return
    }
    // toggle 暂停/播放（同时控制进度条和音乐）
    // 如果 textPausedTimer 也为 true，一并清除
    if (textPausedTimer) setTextPausedTimer(false)
    setIsTapPaused(prev => {
      const next = !prev
      setIsMusicPausedByTap(next)
      return next
    })
  }, [inputFocused, musicExpanded, textPausedTimer])

  const { offsetX, handleTouchStart, handleTouchMove, handleTouchEnd } = useStorySwipe({
    onSwipeLeft: handleGoNext,
    onSwipeRight: handleGoPrev,
    onTap: handleTap,
    canSwipe: () => !isDragActive.current,
  })

  // Drag-to-close handlers
  const dragStartXRef = useRef(0)
  const handleDragStart = useCallback((pageX: number, pageY: number) => {
    dragStartY.current = pageY
    dragStartXRef.current = pageX
    isDragActive.current = false
  }, [])

  const handleDragMove = useCallback((pageX: number, pageY: number) => {
    if (Math.abs(offsetX) > 5) return
    const dy = pageY - dragStartY.current
    const dx = Math.abs(pageX - dragStartXRef.current)
    if (!isDragActive.current) {
      if (dy > 10 && dy > dx * 1.5) {
        isDragActive.current = true
        setIsDraggingDown(true)
      }
      return
    }
    dragY.setValue(Math.max(0, dy))
  }, [dragY, offsetX])

  const handleDragEnd = useCallback(() => {
    isDragActive.current = false
    setIsDraggingDown(false)
    const currentDragY = (dragY as any).__getValue?.() ?? 0
    if (currentDragY > DRAG_CLOSE_THRESHOLD) {
      onClose()
    } else {
      Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start()
    }
  }, [dragY, onClose])

  const commentTarget: SendCommentTarget = currentStory
    ? { kind: 'story', storyId: currentStory.id }
    : null

  const { sendComment } = useSendComment(commentTarget)

  if (!currentChar || !currentStory) return null

  const timeAgo = getTimeAgo(currentStory.createdAt)

  return (
    <Modal visible={modalVisible} transparent animationType="fade" statusBarTranslucent>
      <Animated.View
        style={[styles.container, { transform: [{ translateY: dragY }] }]}
        onTouchStart={e => {
          if (!inputFocused) handleDragStart(e.nativeEvent.pageX, e.nativeEvent.pageY)
        }}
        onTouchMove={e => handleDragMove(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onTouchEnd={() => { if (isDragActive.current || isDraggingDown) handleDragEnd() }}
      >
        {currentStory.images?.[0] && (
          <Image source={{ uri: currentStory.images[0] }} style={styles.blurBg} blurRadius={40} />
        )}

        <View style={[styles.content, { paddingTop: insets.top }]}>
          <ProgressBar total={totalStories} currentIndex={currentIndex} progress={progress} />

          {/* Header - close only, no share */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                <Path d="M15 5L5 15M5 5l10 10" stroke={themeColor} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>

          {/* Character info */}
          <View style={styles.infoRow}>
            <Pressable style={styles.characterInfo} onPress={() => { setModalVisible(false); onNavigateCharacter?.(currentChar.id) }}>
              <Image source={{ uri: currentChar.avatar }} style={styles.avatar} />
              <Text style={[styles.characterName, { color: themeColor }]}>{currentChar.name}</Text>
            </Pressable>
            <Text style={[styles.timeAgo, { color: themeColorSoft }]}>{timeAgo}</Text>
          </View>

          {/* 文字 + 图片：始终用同一个 ScrollView（对齐 web：同容器，仅展开时可滚动），
              避免在 View/ScrollView 间切换导致 ViewerExpandableText 重挂、需点两次才展开。
              点按/左右滑动统一由 useStorySwipe 的 onTouch* 处理（含 tap 检测），不再用 onPress，
              避免 onPress 与手势处理争夺触摸响应者导致点击失效。 */}
          <View
            style={styles.scrollArea}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={textExpanded ? styles.scrollContentExpanded : styles.scrollContent}
            scrollEnabled={textExpanded}
            showsVerticalScrollIndicator={textExpanded}
            keyboardShouldPersistTaps="handled"
          >
            {currentStory.text ? (
              <View style={styles.textWrapper}>
                <ViewerExpandableText
                  style={{ fontSize: 14, lineHeight: 20, color: themeColorText }}
                  expandLabel={t('post.expandText')}
                  collapseLabel={t('post.collapseText')}
                  labelColor={themeColorSoft}
                  onExpandChange={handleTextExpandChange}
                  text={currentStory.text}
                  forceCollapsed={!textExpanded}
                />
              </View>
            ) : null}

            <View
              style={[styles.imageArea, textExpanded && styles.imageAreaExpanded]}
            >
              {currentStory.images?.[0] && (
                <Image
                  source={{ uri: currentStory.images[0] }}
                  style={[styles.storyImage, { transform: [{ translateX: offsetX }] }]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              )}
              {currentStory.type === 'text' && !currentStory.images?.[0] && (
                <View style={styles.textCard}>
                  <Text style={styles.textCardContent}>{currentStory.text}</Text>
                </View>
              )}
            </View>
          </ScrollView>
          </View>

          {(currentStory.musicName || currentStory.musicUrl) && (
            <View style={styles.musicRow}>
              <MusicControl
                key={currentStory.id}
                ref={musicRef}
                musicName={currentStory.musicName ?? 'BGM'}
                musicUrl={currentStory.musicUrl}
                expanded={musicExpanded}
                isDark={isDark}
                onExpandChange={setMusicExpanded}
                onLoadingChange={setBgmLoading}
                onUserPlay={() => setIsMusicPausedByTap(false)}
              />
            </View>
          )}

          <StoryFooter
            key={currentStory.id}
            initialLiked={currentStory.isLiked}
            isDark={isDark}
            onLike={handleLike}
            onInputFocus={() => setInputFocused(true)}
            onInputBlur={() => {
              setInputFocused(false)
              // 键盘收起后保持暂停，需用户点一下屏幕才恢复自动播放
              setIsTapPaused(true)
            }}
            onSent={() => setIsTapPaused(true)}
            onReply={content => sendComment(content)}
          />
        </View>

        {/* Heart animation overlay */}
        <Animated.View style={[styles.heartOverlay, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]} pointerEvents="none">
          <Svg width={64} height={64} viewBox="0 0 24 24" fill={themeColor}>
            <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </Svg>
        </Animated.View>

        {/* Heartbreak animation overlay */}
        <Animated.View style={[styles.heartOverlay, { opacity: heartbreakOpacity }]} pointerEvents="none">
          <Animated.View style={{ transform: [{ translateX: heartbreakLeft }, { rotate: '-15deg' }] }}>
            <Svg width={32} height={56} viewBox="0 0 12 22" fill={themeColor}>
              <Path d="M12 19.35l-1.45-1.32C5.4 13.36 2 10.28 2 6.5 2 3.42 4.42 1 7.5 1c1.74 0 3.41.81 4.5 2.09V19.35z" />
            </Svg>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateX: heartbreakRight }, { rotate: '15deg' }] }}>
            <Svg width={32} height={56} viewBox="12 0 12 22" fill={themeColor}>
              <Path d="M12 19.35V3.09C13.09 1.81 14.76 1 16.5 1 19.58 1 22 3.42 22 6.5c0 3.78-3.4 6.86-8.55 11.54L12 19.35z" />
            </Svg>
          </Animated.View>
        </Animated.View>

      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  blurBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: [{ scale: 1.1 }],
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeAgo: {
    fontSize: 12,
  },
  textWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentExpanded: {
    flexGrow: 0,
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  imageAreaExpanded: {
    flex: 0,
    height: 480,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    maxHeight: 480,
    borderRadius: 30,
  },
  textCard: {
    width: '100%',
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
  musicRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
})
