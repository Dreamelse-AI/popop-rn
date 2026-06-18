import type { ReactNode } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PopopLogo } from '@/shared/assets/popop-logo'

export const AUTH_LOGIN_BG = '#fbf2d8'

const LOGO_VIEWBOX_WIDTH = 169
const LOGO_VIEWBOX_HEIGHT = 133

type AuthLoginShellProps = {
  header?: ReactNode
  footer?: ReactNode
  overlay?: ReactNode
}

/** 登录/启动页全屏布局：顶栏 + Logo 居中 + 底栏（与 Figma 2566-39130 一致，避免过渡时 Logo 跳动） */
export function AuthLoginShell({ header, footer, overlay }: AuthLoginShellProps) {
  const insets = useSafeAreaInsets()
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const logoSize = getPopopLoginLogoSize(windowWidth, windowHeight)

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(32, insets.top + 16),
          paddingBottom: Math.max(32, insets.bottom),
        },
      ]}
    >
      <View style={styles.header}>{header}</View>

      <View style={styles.logoArea} pointerEvents="none">
        <PopopLogo width={logoSize.width} height={logoSize.height} />
      </View>

      <View style={styles.footer}>{footer}</View>

      {overlay}
    </View>
  )
}

/** Figma / auth-base.css：height min(133px, 22dvh)，max-width 45vw */
function getPopopLoginLogoSize(windowWidth: number, windowHeight: number) {
  const logoHeight = Math.min(LOGO_VIEWBOX_HEIGHT, windowHeight * 0.22)
  let logoWidth = logoHeight * (LOGO_VIEWBOX_WIDTH / LOGO_VIEWBOX_HEIGHT)
  logoWidth = Math.min(logoWidth, windowWidth * 0.45, LOGO_VIEWBOX_WIDTH)
  return {
    width: logoWidth,
    height: logoWidth * (LOGO_VIEWBOX_HEIGHT / LOGO_VIEWBOX_WIDTH),
  }
}

/** 启动页占位：与登录页同尺寸顶栏/底栏，仅用于预留布局空间 */
export function createAuthLoginShellPlaceholders(providerCount = 3) {
  const compact = providerCount >= 4
  const buttonHeight = compact ? 52 : 60
  const buttonGap = compact ? 8 : 12

  return {
    header: (
      <View style={styles.placeholderHeader} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.placeholderRegionTrigger} />
        <View style={styles.placeholderSkipButton} />
      </View>
    ),
    footer: (
      <View style={styles.placeholderFooter} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.placeholderButtonGroup, { gap: buttonGap, paddingVertical: 12 }]}>
          {Array.from({ length: providerCount }, (_, index) => (
            <View key={index} style={{ height: buttonHeight }} />
          ))}
        </View>
        <View style={styles.placeholderAgreeRow}>
          <View style={styles.placeholderAgreeText} />
        </View>
      </View>
    ),
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_LOGIN_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  footer: {
    paddingHorizontal: 24,
  },
  placeholderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0,
  },
  placeholderRegionTrigger: {
    height: 32,
    width: 72,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  placeholderSkipButton: {
    height: 32,
    width: 64,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  placeholderFooter: {
    opacity: 0,
  },
  placeholderButtonGroup: {
    flexDirection: 'column',
  },
  placeholderAgreeRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  placeholderAgreeText: {
    height: 16,
    width: 192,
  },
})
