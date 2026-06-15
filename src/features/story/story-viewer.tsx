import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, Modal, StyleSheet, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg'

import type { StoryCharacter, StoryItem } from './story-types'
import { StoryFooter } from './story-footer'
import { storyApi } from './story-api'
import { useStoryReadStore } from './story-store'
import { useStorySwipe } from './use-story-swipe'
import { ShareSheet, type ShareContent } from '@/features/share'
import { useSendComment, type SendCommentTarget } from '@/features/comment'
import { useAutoPlay } from '@/features/post/hooks/use-auto-play'
import { ProgressBar } from '@/features/post/components/progress-bar'
import { MusicControl } from '@/features/post/components/music-control'
import { Image } from 'expo-image'

type StoryViewerProps = {
  characters: StoryCharacter[]
  initialCharacterIndex: number
  initialStoryIndex?: number
  onClose: () => void
  onRead?: (characterId: string, storyId: string) => void
  onCharacterFullyRead?: (characterId: string) => void
  onImageClick?: (story: StoryItem, character: StoryCharacter) => void
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

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  return `${days}일 전`
}

export function StoryViewer({
  characters,
  initialCharacterIndex,
  initialStoryIndex,
  onClose,
  onRead,
  onCharacterFullyRead,
  onImageClick,
}: StoryViewerProps) {
  const insets = useSafeAreaInsets()
  const { isStoryRead, getLastReadStory, setLastReadStory, markStoryRead } = useStoryReadStore()

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
  const [storyIndex, setStoryIndex] = useState(initialStoryIdx)
  const [shareOpen, setShareOpen] = useState(false)
  const [commentToast, setCommentToast] = useState(false)
  const reportedStoryRef = useRef<string | null>(null)

  const currentChar = characters[charIndex]
  const currentStory = currentChar?.stories[storyIndex]
  const totalStories = currentChar?.stories.length ?? 0

  const handleAllCompleteRef = useRef<() => void>(() => {})
  handleAllCompleteRef.current = () => {
    if (!currentChar) return
    onCharacterFullyRead?.(currentChar.id)
    if (charIndex < characters.length - 1) {
      setCharIndex(charIndex + 1)
      setStoryIndex(0)
    } else {
      onClose()
    }
  }

  const handleAllComplete = useCallback(() => {
    handleAllCompleteRef.current()
  }, [])

  const { currentIndex, progress, pause, resume, goTo, goNext, goPrev } = useAutoPlay({
    totalSlides: totalStories,
    duration: 5000,
    initialIndex: initialStoryIdx,
    onComplete: handleAllComplete,
  })

  useEffect(() => {
    setStoryIndex(currentIndex)
  }, [currentIndex])

  const prevCharIndexRef = useRef(charIndex)
  useEffect(() => {
    if (charIndex !== prevCharIndexRef.current) {
      prevCharIndexRef.current = charIndex
      goTo(0)
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

  const handleLike = useCallback((isLiked: boolean) => {
    if (!currentStory) return
    if (isLiked) {
      void storyApi.likeStory(currentStory.id).catch(() => {})
    } else {
      void storyApi.unlikeStory(currentStory.id).catch(() => {})
    }
  }, [currentStory])

  const { offsetX, handleTouchStart, handleTouchMove, handleTouchEnd } = useStorySwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  })

  const shareContent: ShareContent | null = currentChar && currentStory
    ? { kind: 'story', id: currentStory.contentId ?? currentStory.id, characterName: currentChar.name, content: currentStory.text ?? '', imageContent: '' }
    : null

  const commentTarget: SendCommentTarget = currentStory
    ? { kind: 'story', storyId: currentStory.id }
    : null

  const handleCommentSent = useCallback(() => {
    setCommentToast(true)
    setTimeout(() => setCommentToast(false), 1800)
  }, [])

  const { sendComment } = useSendComment(commentTarget, handleCommentSent)

  if (!currentChar || !currentStory) return null

  const timeAgo = getTimeAgo(currentStory.createdAt)

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {currentStory.images?.[0] && (
          <Image source={{ uri: currentStory.images[0] }} style={styles.blurBg} blurRadius={40} />
        )}

        <View style={[styles.content, { paddingTop: insets.top }]}>
          <ProgressBar total={totalStories} currentIndex={storyIndex} progress={progress} />

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                <Path d="M15 5L5 15M5 5l10 10" stroke="white" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </Pressable>
            <Pressable onPress={() => { pause(); setShareOpen(true) }} style={styles.headerButton}>
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                <Path d="M10 3v10M10 3l4 4M10 3L6 7M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          </View>

          {/* Character info */}
          <View style={styles.infoRow}>
            <View style={styles.characterInfo}>
              <Image source={{ uri: currentChar.avatar }} style={styles.avatar} />
              <Text style={styles.characterName}>{currentChar.name}</Text>
            </View>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>

          {currentStory.text ? (
            <Text style={styles.storyText} numberOfLines={2}>{currentStory.text}</Text>
          ) : null}

          {/* Image area */}
          <Pressable
            style={styles.imageArea}
            onPress={() => onImageClick?.(currentStory, currentChar)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {currentStory.images?.[0] && (
              <Image
                source={{ uri: currentStory.images[0] }}
                style={[styles.storyImage, { transform: [{ translateX: offsetX }] }]}
                resizeMode="contain"
              />
            )}
            {currentStory.type === 'text' && !currentStory.images?.[0] && (
              <View style={styles.textCard}>
                <Text style={styles.textCardContent}>{currentStory.text}</Text>
              </View>
            )}
          </Pressable>

          {(currentStory.musicName || currentStory.musicUrl) && (
            <View style={styles.musicRow}>
              <MusicControl musicName={currentStory.musicName ?? '背景音乐'} />
            </View>
          )}

          <StoryFooter
            key={currentStory.id}
            initialLiked={currentStory.isLiked}
            isDark
            onLike={handleLike}
            onInputFocus={pause}
            onInputBlur={resume}
            onReply={content => { void sendComment(content) }}
          />
        </View>

        <ShareSheet open={shareOpen} onClose={() => { setShareOpen(false); resume() }} content={shareContent} />

        {commentToast && (
          <View style={styles.toastWrapper}>
            <View style={styles.toast}>
              <Text style={styles.toastText}>发送成功</Text>
            </View>
          </View>
        )}
      </View>
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
    justifyContent: 'space-between',
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
    color: '#ffffff',
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  storyText: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 112,
    alignItems: 'center',
  },
  toast: {
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toastText: {
    fontSize: 14,
    color: '#ffffff',
  },
})
