import { useCallback, useRef, useState } from 'react'
import { type GestureResponderEvent } from 'react-native'

type UseStorySwipeOptions = {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
  canSwipe?: () => boolean
}

export function useStorySwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  canSwipe,
}: UseStorySwipeOptions) {
  const startXRef = useRef(0)
  const [offsetX, setOffsetX] = useState(0)
  const isDragging = useRef(false)
  const didSwipe = useRef(false)

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    startXRef.current = e.nativeEvent.pageX
    isDragging.current = true
    didSwipe.current = false
  }, [])

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!isDragging.current) return
    if (canSwipe && !canSwipe()) {
      if (offsetX !== 0) setOffsetX(0)
      return
    }
    const diff = e.nativeEvent.pageX - startXRef.current
    setOffsetX(diff)
  }, [canSwipe, offsetX])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    if (offsetX < -threshold) {
      onSwipeLeft()
      didSwipe.current = true
    } else if (offsetX > threshold) {
      onSwipeRight()
      didSwipe.current = true
    }
    setOffsetX(0)
  }, [offsetX, threshold, onSwipeLeft, onSwipeRight])

  return {
    offsetX,
    didSwipe,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
