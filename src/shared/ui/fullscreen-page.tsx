import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type FullscreenPageProps = {
  children: ReactNode
  backgroundColor?: string
}

export function FullscreenPage({
  children,
  backgroundColor = '#f7f7f7',
}: FullscreenPageProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {children}
    </View>
  )
}

type PageHeaderBarProps = {
  children: ReactNode
}

export function PageHeaderBar({ children }: PageHeaderBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.headerOuter, { paddingTop: insets.top }]}>
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
      <View style={styles.backChevron}>
        <Text style={styles.backChevronText}>‹</Text>
      </View>
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
  backChevron: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevronText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000000',
    marginTop: -2,
  },
})
