import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type FullscreenPageProps = {
  children: ReactNode
  backgroundColor?: string
  zIndex?: number
}

export function FullscreenPage({
  children,
  backgroundColor = '#f7f7f7',
  zIndex = 50,
}: FullscreenPageProps) {
  return (
    <View style={[styles.container, { backgroundColor, zIndex, elevation: zIndex }]}>
      {children}
    </View>
  )
}

type PageHeaderBarProps = {
  children: ReactNode
  /** 父级已处理顶部安全区时设为 false（如 Home tab 内 Me 二级页）；App 根级 overlay 保持默认 true */
  includeSafeAreaTop?: boolean
}

export function PageHeaderBar({ children, includeSafeAreaTop = true }: PageHeaderBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.headerOuter, includeSafeAreaTop && { paddingTop: insets.top }]}>
      <View style={styles.headerInner}>
        {children}
      </View>
    </View>
  )
}

type BackButtonProps = {
  onPress: () => void
}

export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable style={styles.backButton} onPress={onPress} accessibilityLabel="Back">
      <Text style={styles.backChevronText}>‹</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    flexDirection: 'column',
  },
  headerOuter: {
    flexShrink: 0,
  },
  headerInner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  backChevronText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
    marginTop: -2,
  },
})
