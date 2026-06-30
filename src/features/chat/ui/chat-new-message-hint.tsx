import { Pressable, Text, StyleSheet } from 'react-native'

import { cdnImage } from '@/shared/lib/cdn'
import { PopImage } from '@/shared/ui/pop-image'

const IconDownBack = cdnImage('assets/dialog/dialogSettings-downBack.png')

type ChatNewMessageHintProps = {
  count: number
  onPress: () => void
}

export function ChatNewMessageHint({ count, onPress }: ChatNewMessageHintProps) {
  const label = count > 1 ? `${count} 条新消息` : '新消息'

  return (
    <Pressable style={styles.pill} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <PopImage uri={IconDownBack} style={styles.icon} contentFit="contain" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  icon: {
    width: 16,
    height: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.8)',
  },
})
