import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type CharacterDetailFooterProps = {
  characterId: string
  actionLabel?: string
  onAction?: () => void
  disabled?: boolean
}

export function CharacterDetailFooter({
  characterId,
  actionLabel,
  onAction,
  disabled = false,
}: CharacterDetailFooterProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingBottom: Math.max(12, insets.bottom) }]}>
      <Pressable
        onPress={onAction}
        disabled={disabled || !onAction}
        style={[styles.button, (disabled || !onAction) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>{actionLabel ?? ''}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    zIndex: 30,
  },
  button: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
})
