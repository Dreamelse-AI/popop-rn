import { View, Text, StyleSheet } from 'react-native'

type ChatCountBadgeProps = {
  count: string
  blur?: boolean
}

export function ChatCountBadge({ count, blur }: ChatCountBadgeProps) {
  return (
    <View style={[styles.container, blur && styles.containerBlur]}>
      <View style={styles.inner}>
        <View style={styles.iconWrapper}>
          <View style={styles.dot} />
        </View>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  )
}

export function formatChatCount(count: number): string {
  if (count >= 1_000_000) {
    const value = count / 1_000_000
    return `${value >= 10 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, '')}M`
  }
  if (count >= 1_000) {
    const value = count / 1_000
    return `${value >= 10 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, '')}K`
  }
  return String(count)
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    borderRadius: 6,
    paddingVertical: 2,
    paddingLeft: 2,
    paddingRight: 4,
    backgroundColor: 'rgba(87,87,87,0.6)',
  },
  containerBlur: {
    backgroundColor: 'rgba(102,102,102,0.6)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  countText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
    lineHeight: 10,
  },
})
