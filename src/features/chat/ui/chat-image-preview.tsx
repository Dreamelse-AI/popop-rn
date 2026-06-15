import { Modal, View, Pressable, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'

import { resolveChatImageDisplayUrl } from '../lib/tos-upload'

type ChatImagePreviewProps = {
  imageUrl: string | null
  onClose: () => void
}

export function ChatImagePreview({ imageUrl, onClose }: ChatImagePreviewProps) {
  if (!imageUrl) return null

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Image
            source={{ uri: resolveChatImageDisplayUrl(imageUrl) }}
            style={styles.image}
            contentFit="contain"
          />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#ffffff',
    lineHeight: 24,
  },
  image: {
    width: 390,
    height: 500,
    maxWidth: '100%',
  },
})
