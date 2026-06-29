import { useCallback, useRef, useState } from 'react'

type TouchEvent = { nativeEvent: { pageX: number; pageY: number } }

type UseStorySwipeOptions = {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onTap?: () => void
  threshold?: number
  canSwipe?: () => boolean
}

export function useStorySwipe({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  threshold = 60,
  canSwipe,
}: UseStorySwipeOptions) {
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const [offsetX, setOffsetX] = useState(0)
  const isDragging = useRef(false)
  const didSwipe = useRef(false)
  const movedRef = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startXRef.current = e.nativeEvent.pageX
    startYRef.current = e.nativeEvent.pageY
    isDragging.current = true
    didSwipe.current = false
    movedRef.current = false
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.nativeEvent.pageX - startXRef.current
    const dy = e.nativeEvent.pageY - startYRef.current
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) movedRef.current = true
    if (canSwipe && !canSwipe()) {
      if (offsetX !== 0) setOffsetX(0)
      return
    }
    setOffsetX(dx)
  }, [canSwipe, offsetX])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    if (offsetX < -threshold) {
      onSwipeLeft()
      didSwipe.current = true
    } else if (offsetX > threshold) {
      onSwipeRight()
      didSwipe.current = true
    } else if (!movedRef.current) {
      onTap?.()
    }
    setOffsetX(0)
  }, [offsetX, threshold, onSwipeLeft, onSwipeRight, onTap])

  return {
    offsetX,
    didSwipe,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
