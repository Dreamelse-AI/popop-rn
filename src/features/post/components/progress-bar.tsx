import { View, StyleSheet } from 'react-native'

type ProgressBarProps = {
  total: number
  currentIndex: number
  progress: number
}

export function ProgressBar({ total, currentIndex, progress }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress * 100}%` : '0%',
              },
            ]}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  track: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
})
