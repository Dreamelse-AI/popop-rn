import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  header?: ReactNode
  showCloseButton?: boolean
  closeIcon?: ReactNode
  /** 顶部拖拽条，默认关闭（与 FE 一致） */
  showHandle?: boolean
}

const SLIDE_DISTANCE = Dimensions.get('window').height
const OPEN_DURATION = 280
const CLOSE_DURATION = 240
const FADE_DURATION = 200

function DefaultCloseIcon() {
  return (
    <View style={defaultCloseStyles.circle}>
      <Text style={defaultCloseStyles.x}>✕</Text>
    </View>
  )
}

const defaultCloseStyles = StyleSheet.create({
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  x: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
    marginTop: -1,
  },
})

export function BottomSheet({
  open,
  onClose,
  children,
  footer,
  header,
  showCloseButton = true,
  closeIcon,
  showHandle = false,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets()
  const [mounted, setMounted] = useState(open)
  const slideAnim = useRef(new Animated.Value(SLIDE_DISTANCE)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const closingRef = useRef(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      closingRef.current = false
      slideAnim.setValue(SLIDE_DISTANCE)
      fadeAnim.setValue(0)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: OPEN_DURATION,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (!mounted) return

    closingRef.current = true
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SLIDE_DISTANCE,
        duration: CLOSE_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false)
        closingRef.current = false
      }
    })
  }, [fadeAnim, mounted, open, slideAnim])

  const handleClose = useCallback(() => {
    if (closingRef.current) return
    onClose()
  }, [onClose])

  if (!mounted && !open) return null

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {showHandle ? <View style={styles.handle} /> : null}

          {showCloseButton ? (
            <Pressable style={styles.closeButton} onPress={handleClose} accessibilityLabel="Close">
              {closeIcon ?? <DefaultCloseIcon />}
            </Pressable>
          ) : null}

          {header}

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f7f7f7',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginTop: 12,
    marginBottom: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 20,
  },
  scrollArea: {
    flexShrink: 1,
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
