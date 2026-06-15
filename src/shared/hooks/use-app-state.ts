import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

type AppStateCallbacks = {
  onForeground?: () => void
  onBackground?: () => void
}

export function useAppState({ onForeground, onBackground }: AppStateCallbacks = {}) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current

      if (prev.match(/inactive|background/) && nextState === 'active') {
        onForeground?.()
      }

      if (prev === 'active' && nextState.match(/inactive|background/)) {
        onBackground?.()
      }

      appStateRef.current = nextState
    })

    return () => subscription.remove()
  }, [onForeground, onBackground])
}
