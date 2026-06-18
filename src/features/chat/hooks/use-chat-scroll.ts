import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native'

import {
  HISTORY_LOAD_MORE_THRESHOLD_PX,
  HISTORY_NEAR_BOTTOM_THRESHOLD_PX,
} from '../config/chat-config'
import type { ChatMessage } from '../model/types'

type UseChatScrollOptions = {
  characterId: string
  listRef: RefObject<FlatList<ChatMessage> | null>
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
  listRef,
  messages,
  isTyping,
  isLoadingCharacter,
  isLoadingHistory,
  isLoadingOlderHistory,
  historyUpHasMore,
  onLoadOlder,
}: UseChatScrollOptions) {
  const initialScrollDoneRef = useRef(false)
  const needsInitialScrollRef = useRef(false)
  const loadingOlderRef = useRef(false)
  const prevLastMessageIdRef = useRef<string | null>(null)
  const contentHeightRef = useRef(0)
  const scrollViewHeightRef = useRef(0)
  const scrollOffsetRef = useRef(0)

  useEffect(() => {
    initialScrollDoneRef.current = false
    needsInitialScrollRef.current = false
    prevLastMessageIdRef.current = null
    loadingOlderRef.current = false
  }, [characterId])

  const isNearBottom = useCallback(() => {
    const distanceFromBottom =
      contentHeightRef.current - scrollOffsetRef.current - scrollViewHeightRef.current
    return distanceFromBottom < HISTORY_NEAR_BOTTOM_THRESHOLD_PX
  }, [])

  const scrollToLatest = useCallback(() => {
    const list = listRef.current
    if (!list || messages.length === 0) return

    const lastIndex = messages.length - 1
    list.scrollToIndex({ index: lastIndex, animated: false, viewPosition: 1 })
  }, [listRef, messages.length])

  const completeInitialScroll = useCallback(() => {
    initialScrollDoneRef.current = true
    needsInitialScrollRef.current = false
    prevLastMessageIdRef.current = messages[messages.length - 1]?.id ?? null
  }, [messages])

  const performInitialScroll = useCallback(() => {
    if (initialScrollDoneRef.current) return
    if (isLoadingCharacter || isLoadingHistory) return
    if (messages.length === 0) return

    scrollToLatest()
    completeInitialScroll()
  }, [
    completeInitialScroll,
    isLoadingCharacter,
    isLoadingHistory,
    messages.length,
    scrollToLatest,
  ])

  useEffect(() => {
    if (isLoadingCharacter || isLoadingHistory) return
    if (messages.length === 0) return
    needsInitialScrollRef.current = true
  }, [isLoadingCharacter, isLoadingHistory, messages.length])

  useEffect(() => {
    if (!needsInitialScrollRef.current || initialScrollDoneRef.current) return
    if (isLoadingCharacter || isLoadingHistory) return
    if (messages.length === 0) return

    requestAnimationFrame(() => {
      requestAnimationFrame(performInitialScroll)
    })
  }, [isLoadingCharacter, isLoadingHistory, messages, performInitialScroll])

  useEffect(() => {
    if (!initialScrollDoneRef.current) return
    if (messages.length === 0) return

    const lastMessageId = messages[messages.length - 1]?.id ?? null
    if (lastMessageId === prevLastMessageIdRef.current) return

    const shouldStick = isNearBottom() || isTyping
    prevLastMessageIdRef.current = lastMessageId

    if (shouldStick) {
      requestAnimationFrame(scrollToLatest)
    }
  }, [isTyping, messages, isNearBottom, scrollToLatest])

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
            listRef.current?.scrollToOffset({ offset, animated: false })
          })
        })
        .finally(() => {
          loadingOlderRef.current = false
        })
    },
    [historyUpHasMore, isLoadingOlderHistory, onLoadOlder, listRef],
  )

  const onContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentHeightRef.current = h
      if (!needsInitialScrollRef.current || initialScrollDoneRef.current) return
      if (isLoadingCharacter || isLoadingHistory) return
      if (messages.length === 0) return

      requestAnimationFrame(() => {
        scrollToLatest()
        completeInitialScroll()
      })
    },
    [
      completeInitialScroll,
      isLoadingCharacter,
      isLoadingHistory,
      messages.length,
      scrollToLatest,
    ],
  )

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: Math.max(0, info.averageItemLength * info.index),
        animated: false,
      })
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: false,
          viewPosition: 1,
        })
      })
    },
    [listRef],
  )

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    scrollViewHeightRef.current = event.nativeEvent.layout.height
  }, [])

  return { onScroll, onContentSizeChange, onLayout, onScrollToIndexFailed }
}
