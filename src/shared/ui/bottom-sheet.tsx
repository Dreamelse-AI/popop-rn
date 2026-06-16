import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SheetCloseIcon } from '@/shared/ui/sheet-primitives'

import { SHEET } from './sheet-tokens'

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
  /** 是否用 ScrollView 包裹 children，含 FlatList 时设为 false */
  scrollable?: boolean
  /** 按内容高度展示，不撑满剩余空间 */
  fitContent?: boolean
}

const SLIDE_DISTANCE = Dimensions.get('window').height
const OPEN_DURATION = 280
const CLOSE_DURATION = 240
const FADE_DURATION = 200

export function BottomSheet({
  open,
  onClose,
  children,
  footer,
  header,
  showCloseButton = true,
  closeIcon,
  showHandle = false,
  scrollable = true,
  fitContent = false,
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

  const bodyContent = scrollable ? (
    <ScrollView
      style={[styles.scrollArea, fitContent && styles.scrollAreaFitContent]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.bodyArea, fitContent && styles.bodyAreaFitContent]}>{children}</View>
  )

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            fitContent && styles.sheetFitContent,
            { paddingBottom: insets.bottom, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {showHandle ? <View style={styles.handle} /> : null}

          {showCloseButton ? (
            <Pressable style={styles.closeButton} onPress={handleClose} accessibilityLabel="Close">
              {closeIcon ?? <SheetCloseIcon />}
            </Pressable>
          ) : null}

          {header}

          {bodyContent}

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
    backgroundColor: SHEET.backdrop,
  },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: SHEET.radius,
    borderTopRightRadius: SHEET.radius,
    backgroundColor: SHEET.background,
    overflow: 'hidden',
  },
  sheetFitContent: {
    maxHeight: undefined,
  },
  handle: {
    alignSelf: 'center',
    width: SHEET.handle.width,
    height: SHEET.handle.height,
    borderRadius: SHEET.handle.radius,
    backgroundColor: SHEET.handle.bg,
    marginTop: SHEET.handle.marginTop,
    marginBottom: SHEET.handle.marginBottom,
  },
  closeButton: {
    position: 'absolute',
    right: SHEET.close.right,
    top: SHEET.close.top,
    zIndex: 20,
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollAreaFitContent: {
    flexGrow: 0,
    flexShrink: 0,
  },
  bodyArea: {
    flexShrink: 1,
  },
  bodyAreaFitContent: {
    flexGrow: 0,
    flexShrink: 0,
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: SHEET.footer.paddingH,
    paddingVertical: SHEET.footer.paddingV,
  },
})
