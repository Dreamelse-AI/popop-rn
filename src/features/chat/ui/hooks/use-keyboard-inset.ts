import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

export function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    if (!active) {
      setInset(0)
      return
    }

    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow',
      (e) => {
        setInset(Math.round(e.endCoordinates.height))
      },
    )

    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setInset(0)
      },
    )

    return () => {
      showListener.remove()
      hideListener.remove()
    }
  }, [active])

  return inset
}

export function prefersMockKeyboard() {
  return false
}
