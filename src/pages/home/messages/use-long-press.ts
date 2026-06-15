import { useCallback, useRef } from 'react'
import { type GestureResponderEvent } from 'react-native'

const DEFAULT_DELAY_MS = 500
const MOVE_CANCEL_PX = 10

type UseLongPressOptions = {
  onLongPress: () => void
  delayMs?: number
}

export function useLongPress({ onLongPress, delayMs = DEFAULT_DELAY_MS }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)
  const onLongPressRef = useRef(onLongPress)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  onLongPressRef.current = onLongPress

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    pointerStartRef.current = null
  }, [])

  const onTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      longPressTriggeredRef.current = false
      clear()
      const touch = e.nativeEvent
      pointerStartRef.current = { x: touch.pageX, y: touch.pageY }

      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true
        onLongPressRef.current()
      }, delayMs)
    },
    [clear, delayMs],
  )

  const onTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      if (!pointerStartRef.current || !timerRef.current) return

      const touch = e.nativeEvent
      const dx = touch.pageX - pointerStartRef.current.x
      const dy = touch.pageY - pointerStartRef.current.y
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
        clear()
      }
    },
    [clear],
  )

  const onTouchEnd = useCallback(() => {
    clear()
  }, [clear])

  const wasLongPress = useCallback(() => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return true
    }
    return false
  }, [])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    wasLongPress,
  }
}
