import { View, Text, StyleSheet } from 'react-native'

export function ChatMockKeyboard() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.text}>Keyboard</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 260,
    backgroundColor: '#dedede',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
})
