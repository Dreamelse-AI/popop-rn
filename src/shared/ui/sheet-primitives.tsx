import type { ReactNode } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { dialogPageStyleSettingsAssets } from '@/shared/assets/dialog/dialog-page-style-settings'
import { Image } from 'expo-image'

import { SHEET } from './sheet-tokens'

export function SheetCloseIcon() {
  return <Image source={{ uri: dialogPageStyleSettingsAssets.close }} style={{ width: SHEET.close.iconSize, height: SHEET.close.iconSize }} />
}

type SheetHeaderAction = {
  label: string
  onPress: () => void
}

type SheetHeaderProps = {
  title: string
  hint?: string
  action?: SheetHeaderAction
  style?: StyleProp<ViewStyle>
}

export function SheetHeader({ title, hint, action, style }: SheetHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {action ? (
        <Pressable onPress={action.onPress}>
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

type SheetBodyProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  /** 列表区域最大高度，默认不限制 */
  maxHeight?: number
}

export function SheetBody({ children, style, maxHeight }: SheetBodyProps) {
  return (
    <View style={[styles.body, maxHeight != null && { maxHeight }, style]}>
      {children}
    </View>
  )
}

type SheetListRowProps = {
  title: string
  onPress: () => void
  badge?: string
  trailing?: ReactNode
  disabled?: boolean
}

export function SheetListRow({ title, onPress, badge, trailing, disabled }: SheetListRowProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, disabled && styles.rowDisabled]}
    >
      <Text style={styles.rowTitle} numberOfLines={1}>
        {title}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {trailing}
    </Pressable>
  )
}

type SheetFooterButtonProps = {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  textColor?: string
}

export function SheetFooterButton({ label, onPress, disabled, loading, textColor }: SheetFooterButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={[styles.confirmButton, isDisabled && styles.confirmButtonDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={textColor ?? SHEET.confirm.textColor} />
      ) : (
        <Text style={[styles.confirmText, textColor ? { color: textColor } : null]}>{label}</Text>
      )}
    </Pressable>
  )
}

type SheetEmptyProps = {
  message: string
}

export function SheetEmpty({ message }: SheetEmptyProps) {
  return <Text style={styles.empty}>{message}</Text>
}

type SheetLoadingProps = {
  message?: string
}

export function SheetLoading({ message }: SheetLoadingProps) {
  if (message) {
    return <Text style={styles.empty}>{message}</Text>
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color="#000000" />
    </View>
  )
}

type SheetRetryProps = {
  message: string
  retryLabel: string
  onRetry: () => void
}

export function SheetRetry({ message, retryLabel, onRetry }: SheetRetryProps) {
  return (
    <View style={styles.retryContainer}>
      <Text style={styles.retryMessage}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>{retryLabel}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SHEET.header.paddingH,
    paddingTop: SHEET.header.paddingTop,
    paddingBottom: SHEET.header.paddingBottom,
  },
  title: {
    fontSize: SHEET.title.fontSize,
    fontWeight: SHEET.title.fontWeight,
    color: SHEET.title.color,
  },
  hint: {
    marginTop: 6,
    fontSize: SHEET.hint.fontSize,
    color: SHEET.hint.color,
  },
  actionText: {
    marginTop: 8,
    fontSize: SHEET.hint.fontSize,
    color: SHEET.hint.color,
  },
  body: {
    paddingHorizontal: SHEET.content.paddingH,
    paddingBottom: SHEET.content.paddingBottom,
    gap: SHEET.content.gap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: SHEET.row.height,
    borderRadius: SHEET.row.radius,
    backgroundColor: SHEET.row.bg,
    paddingHorizontal: SHEET.row.paddingH,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  badge: {
    borderRadius: 999,
    backgroundColor: SHEET.badge.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: SHEET.badge.fontSize,
    fontWeight: SHEET.badge.fontWeight,
    color: SHEET.badge.textColor,
  },
  confirmButton: {
    height: SHEET.confirm.height,
    borderRadius: SHEET.confirm.radius,
    backgroundColor: SHEET.confirm.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: SHEET.confirm.disabledOpacity,
  },
  confirmText: {
    fontSize: SHEET.confirm.fontSize,
    fontWeight: SHEET.confirm.fontWeight,
    color: SHEET.confirm.textColor,
  },
  empty: {
    paddingVertical: SHEET.empty.paddingV,
    textAlign: 'center',
    fontSize: SHEET.empty.fontSize,
    color: SHEET.empty.color,
  },
  loadingContainer: {
    paddingVertical: SHEET.empty.paddingV,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  retryMessage: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: SHEET.retry.bg,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: SHEET.retry.fontSize,
    fontWeight: SHEET.retry.fontWeight,
    color: SHEET.retry.textColor,
  },
})
