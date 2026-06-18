import { useEffect, useState } from 'react'
import { Dimensions, Keyboard, Platform } from 'react-native'

function resolveKeyboardInset(screenY: number): number {
  const windowHeight = Dimensions.get('window').height
  return Math.max(0, Math.round(windowHeight - screenY))
}

export function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    if (!active) {
      setInset(0)
      return
    }

    // Android 使用 adjustResize，窗口会随键盘收缩，避免重复叠加 padding。
    if (Platform.OS === 'android') {
      setInset(0)
      return
    }

    const showEvent = 'keyboardWillChangeFrame'
    const hideEvent = 'keyboardWillHide'

    const showListener = Keyboard.addListener(showEvent, (e) => {
      setInset(resolveKeyboardInset(e.endCoordinates.screenY))
    })

    const hideListener = Keyboard.addListener(hideEvent, () => {
      setInset(0)
    })

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
