import { View, Text, StyleSheet } from 'react-native'

export function StoryBarEmpty() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        暂无好友发布动态，聊天越多好友发布动态的概率越大
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
    lineHeight: 22,
  },
})
