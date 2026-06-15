import { useCallback, useEffect, useRef, useState } from 'react'

type UseAutoPlayOptions = {
  totalSlides: number
  duration?: number
  initialIndex?: number
  onComplete: () => void
}

export function useAutoPlay({ totalSlides, duration = 5000, initialIndex = 0, onComplete }: UseAutoPlayOptions) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [restartTick, setRestartTick] = useState(0)

  const rafRef = useRef(0)
  const startTimeRef = useRef(0)
  const elapsedBeforePauseRef = useRef(0)
  const currentIndexRef = useRef(initialIndex)
  const isPausedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  currentIndexRef.current = currentIndex
  isPausedRef.current = isPaused

  const startTimer = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    startTimeRef.current = Date.now()

    const loop = () => {
      const elapsed = Date.now() - startTimeRef.current + elapsedBeforePauseRef.current
      const pct = Math.min(elapsed / duration, 1)
      setProgress(pct)

      if (pct >= 1) {
        const idx = currentIndexRef.current
        if (idx < totalSlides - 1) {
          elapsedBeforePauseRef.current = 0
          setProgress(0)
          setCurrentIndex(idx + 1)
        } else {
          setProgress(1)
          onCompleteRef.current()
        }
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [duration, totalSlides])

  useEffect(() => {
    if (isPaused || totalSlides === 0) return
    startTimer()
    return () => cancelAnimationFrame(rafRef.current)
  }, [currentIndex, isPaused, totalSlides, startTimer, restartTick])

  const pause = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    elapsedBeforePauseRef.current += Date.now() - startTimeRef.current
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const goTo = useCallback((index: number) => {
    cancelAnimationFrame(rafRef.current)
    elapsedBeforePauseRef.current = 0
    setProgress(0)
    setCurrentIndex(index)
    currentIndexRef.current = index
    setIsPaused(false)
    setRestartTick(t => t + 1)
  }, [])

  const goNext = useCallback(() => {
    const idx = currentIndexRef.current
    if (idx < totalSlides - 1) {
      goTo(idx + 1)
    } else {
      onCompleteRef.current()
    }
  }, [totalSlides, goTo])

  const goPrev = useCallback(() => {
    const idx = currentIndexRef.current
    if (idx > 0) {
      goTo(idx - 1)
    }
  }, [goTo])

  return { currentIndex, progress, isPaused, pause, resume, goTo, goNext, goPrev }
}
