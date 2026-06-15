import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'

type UseToastResult = {
  toast: string | null
  showToast: (message: string) => void
  clearToast: () => void
}

const TOAST_DURATION_MS = 2200

export function useToast(): UseToastResult {
  const [toast, setToast] = useState<string | null>(null)

  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  const showToast = useCallback((message: string) => {
    setToast(message)
  }, [])

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(clearToast, TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast, clearToast])

  return { toast, showToast, clearToast }
}

type ToastProps = {
  message: string | null
}

export function Toast({ message }: ToastProps) {
  if (!message) return null

  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 90,
    maxWidth: 320,
    backgroundColor: 'rgba(26,26,26,0.9)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
})
