import { View, Text, Pressable, StyleSheet } from 'react-native'

type ChatNotFoundProps = {
  onBack: () => void
}

export function ChatNotFound({ onBack }: ChatNotFoundProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>找不到该角色会话</Text>
      <Pressable onPress={onBack} style={styles.button}>
        <Text style={styles.buttonText}>返回</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbf2d8',
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.5)',
  },
  button: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
})
