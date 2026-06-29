import { useCallback, useEffect, useRef, useState } from 'react'

type UseAutoPlayOptions = {
  totalSlides: number
  duration?: number
  initialIndex?: number
  /** 外部暂停信号：为 true 时定时器不会启动 */
  externalPaused?: boolean
  onComplete: () => void
}

export function useAutoPlay({ totalSlides, duration = 5000, initialIndex = 0, externalPaused = false, onComplete }: UseAutoPlayOptions) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [restartTick, setRestartTick] = useState(0)

  const rafRef = useRef(0)
  const startTimeRef = useRef(0)
  const elapsedBeforePauseRef = useRef(0)
  const runningRef = useRef(false)
  const currentIndexRef = useRef(initialIndex)
  const isPausedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  currentIndexRef.current = currentIndex
  isPausedRef.current = isPaused

  const startTimer = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    startTimeRef.current = Date.now()
    runningRef.current = true

    const loop = () => {
      const elapsed = Date.now() - startTimeRef.current + elapsedBeforePauseRef.current
      const pct = Math.min(elapsed / duration, 1)
      setProgress(pct)

      if (pct >= 1) {
        const idx = currentIndexRef.current
        if (idx < totalSlides - 1) {
          // 自动进入下一条：计时器已不再运行，复位 runningRef，避免随后的 pause() 误累加旧时间
          runningRef.current = false
          elapsedBeforePauseRef.current = 0
          setProgress(0)
          setCurrentIndex(idx + 1)
        } else {
          setProgress(1)
          runningRef.current = false
          onCompleteRef.current()
        }
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [duration, totalSlides])

  useEffect(() => {
    if (isPaused || externalPaused || totalSlides === 0) {
      cancelAnimationFrame(rafRef.current)
      if (runningRef.current) {
        elapsedBeforePauseRef.current += Date.now() - startTimeRef.current
        runningRef.current = false
      }
      return
    }
    startTimer()
    return () => cancelAnimationFrame(rafRef.current)
  }, [currentIndex, isPaused, externalPaused, totalSlides, startTimer, restartTick])

  const pause = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    // 仅在计时器真正运行时累加已用时间，避免未启动就 pause 累加错误的巨大值导致计时错乱
    if (runningRef.current) {
      elapsedBeforePauseRef.current += Date.now() - startTimeRef.current
      runningRef.current = false
    }
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const goTo = useCallback((index: number) => {
    cancelAnimationFrame(rafRef.current)
    elapsedBeforePauseRef.current = 0
    runningRef.current = false
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
