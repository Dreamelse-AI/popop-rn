import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
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
  /** 占满视口可用高度（自底部顶起，顶部预留吉祥物探出空间） */
  fullHeight?: boolean
  /** 固定为视口高度的比例（0~1），如 0.9 表示 90% */
  heightRatio?: number
  /** 允许 sheet 顶部内容溢出（如 Logo 探出圆角） */
  sheetOverflowVisible?: boolean
  backgroundColor?: string
  footerStyle?: StyleProp<ViewStyle>
  /** 关闭动画结束且 Modal 卸载后触发 */
  onClosed?: () => void
  /** 嵌入父级 Modal/View，不新建 RN Modal（用于设置侧栏内叠层） */
  embedded?: boolean
  /** embedded 模式 z-index，后开的弹窗应更大 */
  embeddedZIndex?: number
}

const AUTH_SHEET_MAX_HEIGHT = 688

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
  fullHeight = false,
  heightRatio,
  sheetOverflowVisible = false,
  backgroundColor = SHEET.background,
  footerStyle,
  onClosed,
  embedded = false,
  embeddedZIndex = 60,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const [mounted, setMounted] = useState(open)
  const slideAnim = useRef(new Animated.Value(SLIDE_DISTANCE)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const closingRef = useRef(false)
  const onClosedRef = useRef(onClosed)
  onClosedRef.current = onClosed

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
        onClosedRef.current?.()
      }
    })
  }, [fadeAnim, mounted, open, slideAnim])

  const handleClose = useCallback(() => {
    if (closingRef.current) return
    onClose()
  }, [onClose])

  if (!mounted && !open) return null

  const peekOffset = Math.max(56, insets.top + 12)
  const fullSheetHeight = Math.min(AUTH_SHEET_MAX_HEIGHT, windowHeight - peekOffset)
  const ratioSheetHeight =
    heightRatio != null ? Math.round(windowHeight * heightRatio) : null

  const useColumnLayout = fullHeight || ratioSheetHeight != null

  const bodyContent = scrollable ? (
    <ScrollView
      style={[
        styles.scrollArea,
        fitContent && styles.scrollAreaFitContent,
        useColumnLayout && !fitContent && styles.scrollAreaFullHeight,
      ]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.bodyArea,
        fitContent && styles.bodyAreaFitContent,
        useColumnLayout && !fitContent && styles.bodyAreaFullHeight,
      ]}
    >
      {children}
    </View>
  )

  const sheetNode = (
    <View style={[styles.overlay, fullHeight && { paddingTop: peekOffset }]}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          fitContent && styles.sheetFitContent,
          fullHeight && { height: fullSheetHeight, maxHeight: fullSheetHeight },
          ratioSheetHeight != null && { height: ratioSheetHeight, maxHeight: ratioSheetHeight },
          useColumnLayout && styles.sheetFullHeight,
          sheetOverflowVisible && styles.sheetOverflowVisible,
          { backgroundColor, paddingBottom: insets.bottom, transform: [{ translateY: slideAnim }] },
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

        {footer ? <View style={[styles.footer, footerStyle]}>{footer}</View> : null}
      </Animated.View>
    </View>
  )

  return embedded ? (
    <View
      style={[styles.embeddedHost, { zIndex: embeddedZIndex }]}
      pointerEvents={mounted || open ? 'auto' : 'box-none'}
    >
      {sheetNode}
    </View>
  ) : (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      {sheetNode}
    </Modal>
  )
}

const styles = StyleSheet.create({
  embeddedHost: {
    ...StyleSheet.absoluteFill,
  },
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
  sheetOverflowVisible: {
    overflow: 'visible',
  },
  sheetFullHeight: {
    flexDirection: 'column',
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
  scrollAreaFullHeight: {
    flex: 1,
  },
  bodyArea: {
    flexShrink: 1,
  },
  bodyAreaFitContent: {
    flexGrow: 0,
    flexShrink: 0,
  },
  bodyAreaFullHeight: {
    flex: 1,
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: SHEET.footer.paddingH,
    paddingVertical: SHEET.footer.paddingV,
  },
})
