import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_SECONDS = 60

export function useCountdown(seconds = DEFAULT_SECONDS) {
  const [remaining, setRemaining] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isActive = remaining > 0

  const start = useCallback(() => {
    setRemaining(seconds)
  }, [seconds])

  const reset = useCallback(() => {
    setRemaining(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (remaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [remaining > 0])

  return { remaining, isActive, start, reset }
}
