import { View, Text, StyleSheet } from 'react-native';

type AiGeneratingSparklesProps = {
  scale?: number;
};

export function AiGeneratingSparkles({ scale = 1 }: AiGeneratingSparklesProps) {
  return (
    <View style={styles.container}>
      {[0, 1, 2].map((index) => (
        <Text
          key={index}
          style={[
            styles.sparkle,
            { opacity: 0.9 - index * 0.15, transform: [{ scale }] },
          ]}
        >
          ✦
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkle: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.9)',
  },
});
