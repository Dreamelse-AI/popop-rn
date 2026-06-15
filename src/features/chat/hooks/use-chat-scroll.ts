import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native'

import {
  HISTORY_LOAD_MORE_THRESHOLD_PX,
  HISTORY_NEAR_BOTTOM_THRESHOLD_PX,
} from '../config/chat-config'
import type { ChatMessage } from '../model/types'

type UseChatScrollOptions = {
  characterId: string
  scrollRef: RefObject<ScrollView | null>
  messages: ChatMessage[]
  isTyping: boolean
  isLoadingCharacter: boolean
  isLoadingHistory: boolean
  isLoadingOlderHistory: boolean
  historyUpHasMore: boolean
  onLoadOlder: () => Promise<boolean>
}

export function useChatScroll({
  characterId,
  scrollRef,
  messages,
  isTyping,
  isLoadingCharacter,
  isLoadingHistory,
  isLoadingOlderHistory,
  historyUpHasMore,
  onLoadOlder,
}: UseChatScrollOptions) {
  const initialScrollDoneRef = useRef(false)
  const loadingOlderRef = useRef(false)
  const prevLastMessageIdRef = useRef<string | null>(null)
  const contentHeightRef = useRef(0)
  const scrollViewHeightRef = useRef(0)
  const scrollOffsetRef = useRef(0)
  const prevContentHeightRef = useRef(0)

  useEffect(() => {
    initialScrollDoneRef.current = false
    prevLastMessageIdRef.current = null
    loadingOlderRef.current = false
  }, [characterId])

  const isNearBottom = useCallback(() => {
    const distanceFromBottom =
      contentHeightRef.current - scrollOffsetRef.current - scrollViewHeightRef.current
    return distanceFromBottom < HISTORY_NEAR_BOTTOM_THRESHOLD_PX
  }, [])

  const scrollToEnd = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: false })
  }, [scrollRef])

  useEffect(() => {
    if (isLoadingCharacter || isLoadingHistory || initialScrollDoneRef.current) return
    if (messages.length === 0) return

    initialScrollDoneRef.current = true
    prevLastMessageIdRef.current = messages[messages.length - 1]?.id ?? null
    requestAnimationFrame(scrollToEnd)
  }, [isLoadingCharacter, isLoadingHistory, messages, scrollToEnd])

  useEffect(() => {
    if (!initialScrollDoneRef.current) return
    if (messages.length === 0) return

    const lastMessageId = messages[messages.length - 1]?.id ?? null
    if (lastMessageId === prevLastMessageIdRef.current) return

    const shouldStick = isNearBottom() || isTyping
    prevLastMessageIdRef.current = lastMessageId

    if (shouldStick) {
      requestAnimationFrame(scrollToEnd)
    }
  }, [isTyping, messages, isNearBottom, scrollToEnd])

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
      scrollOffsetRef.current = contentOffset.y
      contentHeightRef.current = contentSize.height
      scrollViewHeightRef.current = layoutMeasurement.height

      if (
        !historyUpHasMore ||
        isLoadingOlderHistory ||
        loadingOlderRef.current ||
        !initialScrollDoneRef.current
      ) {
        return
      }

      if (contentOffset.y > HISTORY_LOAD_MORE_THRESHOLD_PX) return

      loadingOlderRef.current = true
      const previousContentHeight = contentHeightRef.current

      void onLoadOlder()
        .then((loaded) => {
          if (!loaded) return
          requestAnimationFrame(() => {
            const newContentHeight = contentHeightRef.current
            const offset = scrollOffsetRef.current + (newContentHeight - previousContentHeight)
            scrollRef.current?.scrollTo({ y: offset, animated: false })
          })
        })
        .finally(() => {
          loadingOlderRef.current = false
        })
    },
    [historyUpHasMore, isLoadingOlderHistory, onLoadOlder, scrollRef],
  )

  const onContentSizeChange = useCallback((_w: number, h: number) => {
    prevContentHeightRef.current = contentHeightRef.current
    contentHeightRef.current = h
  }, [])

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    scrollViewHeightRef.current = event.nativeEvent.layout.height
  }, [])

  return { onScroll, onContentSizeChange, onLayout }
}
