import type { ReactNode } from 'react'
import { View, StyleSheet, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { PopopLogo } from '@/shared/assets/popop-logo'

const LOGO_VIEWBOX_WIDTH = 169
const LOGO_VIEWBOX_HEIGHT = 133
const LOGO_WORDMARK_VIEWBOX_Y = 105.615
const LOGO_PEEK_TRANSLATE_RATIO = 0.42
const LOGO_PEEK_WORDMARK_TOP_RATIO =
  (LOGO_WORDMARK_VIEWBOX_Y - LOGO_PEEK_TRANSLATE_RATIO * LOGO_VIEWBOX_HEIGHT) / LOGO_VIEWBOX_WIDTH
const LOGO_PEEK_HEADER_HEIGHT_RATIO =
  (LOGO_WORDMARK_VIEWBOX_Y +
    (LOGO_VIEWBOX_HEIGHT - LOGO_WORDMARK_VIEWBOX_Y) -
    LOGO_PEEK_TRANSLATE_RATIO * LOGO_VIEWBOX_HEIGHT) /
  LOGO_VIEWBOX_WIDTH
const LOGO_PEEK_TITLE_GAP_RATIO = 24 / LOGO_VIEWBOX_WIDTH

type AuthBottomSheetProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  header?: ReactNode
  showLogo?: boolean
  logoPeek?: boolean
  fitContent?: boolean
  fullHeight?: boolean
  showCloseButton?: boolean
  sheetBackgroundColor?: string
  footerStyle?: StyleProp<ViewStyle>
  onClosed?: () => void
}

function AuthEmailLogoHeader() {
  const { width: windowWidth } = useWindowDimensions()
  const logoWidth = Math.min(LOGO_VIEWBOX_WIDTH, windowWidth * 0.45)
  const logoHeight = logoWidth * (LOGO_VIEWBOX_HEIGHT / LOGO_VIEWBOX_WIDTH)

  return (
    <View
      style={[
        styles.logoPeekHeader,
        {
          paddingTop: logoWidth * LOGO_PEEK_WORDMARK_TOP_RATIO,
          minHeight: logoWidth * LOGO_PEEK_HEADER_HEIGHT_RATIO,
          marginBottom: logoWidth * LOGO_PEEK_TITLE_GAP_RATIO,
        },
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.logoPeekImage,
          {
            width: logoWidth,
            height: logoHeight,
            marginLeft: -logoWidth / 2,
            transform: [{ translateY: -logoHeight * LOGO_PEEK_TRANSLATE_RATIO }],
          },
        ]}
      >
        <PopopLogo width={logoWidth} height={logoHeight} />
      </View>
    </View>
  )
}

export function AuthBottomSheet({
  open,
  onClose,
  children,
  footer,
  header,
  showLogo = true,
  logoPeek = false,
  fitContent = false,
  fullHeight = false,
  showCloseButton = true,
  sheetBackgroundColor,
  footerStyle,
  onClosed,
}: AuthBottomSheetProps) {
  const sheetHeader =
    header ??
    (showLogo && !logoPeek ? (
      <View style={styles.logoWrapper}>
        <PopopLogo width={130} height={100} />
      </View>
    ) : logoPeek && fullHeight ? (
      <AuthEmailLogoHeader />
    ) : undefined)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={sheetHeader}
      footer={footer}
      fitContent={fitContent}
      fullHeight={fullHeight}
      showCloseButton={showCloseButton}
      sheetOverflowVisible={logoPeek}
      backgroundColor={sheetBackgroundColor}
      footerStyle={footerStyle}
      onClosed={onClosed}
    >
      {children}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  logoWrapper: {
    alignItems: 'center',
    paddingTop: 8,
  },
  logoPeekHeader: {
    position: 'relative',
    flexShrink: 0,
    zIndex: 10,
  },
  logoPeekImage: {
    position: 'absolute',
    left: '50%',
    top: 0,
    zIndex: 10,
  },
})
