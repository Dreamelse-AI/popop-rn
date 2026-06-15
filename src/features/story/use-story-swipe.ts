import { useCallback, useRef, useState } from 'react'
import { type GestureResponderEvent } from 'react-native'

type UseStorySwipeOptions = {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
}

export function useStorySwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
}: UseStorySwipeOptions) {
  const startXRef = useRef(0)
  const [offsetX, setOffsetX] = useState(0)
  const isDragging = useRef(false)

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    startXRef.current = e.nativeEvent.pageX
    isDragging.current = true
  }, [])

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!isDragging.current) return
    const diff = e.nativeEvent.pageX - startXRef.current
    setOffsetX(diff)
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    if (offsetX < -threshold) {
      onSwipeLeft()
    } else if (offsetX > threshold) {
      onSwipeRight()
    }
    setOffsetX(0)
  }, [offsetX, threshold, onSwipeLeft, onSwipeRight])

  return {
    offsetX,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
