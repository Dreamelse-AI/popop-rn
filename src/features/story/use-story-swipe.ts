import { useCallback, useRef } from 'react'
import { type GestureResponderEvent } from 'react-native'

type UseStorySwipeOptions = {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onTap?: () => void
  threshold?: number
  canSwipe?: () => boolean
  /** 展开全文：先判断横向滑动，横向时锁住 ScrollView 纵向滚动 */
  allowVerticalScroll?: boolean
  onHorizontalLock?: (locked: boolean) => void
}

function isHorizontalMove(dx: number, dy: number) {
  return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)
}

export function useStorySwipe({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  threshold = 60,
  canSwipe,
  allowVerticalScroll = false,
  onHorizontalLock,
}: UseStorySwipeOptions) {
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const offsetRef = useRef(0)
  const isDragging = useRef(false)
  const didSwipe = useRef(false)
  const movedRef = useRef(false)
  const horizontalLockRef = useRef(false)

  const releaseHorizontalLock = useCallback(() => {
    if (!horizontalLockRef.current) return
    horizontalLockRef.current = false
    onHorizontalLock?.(false)
  }, [onHorizontalLock])

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    startXRef.current = e.nativeEvent.pageX
    startYRef.current = e.nativeEvent.pageY
    isDragging.current = true
    didSwipe.current = false
    movedRef.current = false
    offsetRef.current = 0
  }, [])

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!isDragging.current) return
    const dx = e.nativeEvent.pageX - startXRef.current
    const dy = e.nativeEvent.pageY - startYRef.current
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) movedRef.current = true
    if (canSwipe && !canSwipe()) {
      offsetRef.current = 0
      return
    }

    if (allowVerticalScroll) {
      if (isHorizontalMove(dx, dy)) {
        if (!horizontalLockRef.current) {
          horizontalLockRef.current = true
          onHorizontalLock?.(true)
        }
        offsetRef.current = dx
      }
      return
    }

    offsetRef.current = dx
  }, [allowVerticalScroll, canSwipe, onHorizontalLock])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = offsetRef.current
    offsetRef.current = 0
    const wasHorizontalLock = horizontalLockRef.current
    releaseHorizontalLock()

    if (wasHorizontalLock || !allowVerticalScroll) {
      if (dx < -threshold) {
        onSwipeLeft()
        didSwipe.current = true
        return
      }
      if (dx > threshold) {
        onSwipeRight()
        didSwipe.current = true
        return
      }
    }

    if (!movedRef.current) {
      onTap?.()
    }
  }, [allowVerticalScroll, onSwipeLeft, onSwipeRight, onTap, releaseHorizontalLock, threshold])

  const getSwipeOffset = useCallback(() => offsetRef.current, [])

  return {
    getSwipeOffset,
    didSwipe,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
