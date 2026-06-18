import { View, StyleSheet } from 'react-native'

export function StoryBarSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.circle} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    gap: 12,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
})
