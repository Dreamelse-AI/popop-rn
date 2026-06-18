import { Modal, View, Pressable, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'

import { resolveChatImageDisplayUrl } from '../lib/tos-upload'

type ChatImagePreviewProps = {
  imageUrl: string | null
  onClose: () => void
}

export function ChatImagePreview({ imageUrl, onClose }: ChatImagePreviewProps) {
  const insets = useSafeAreaInsets()

  if (!imageUrl) return null

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="关闭预览"
          accessibilityRole="button"
        />

        <Pressable
          onPress={() => {
            // 点击图片区域不关闭，仅拦截背景点击
          }}
          style={styles.imageWrap}
        >
          <Image
            source={{ uri: resolveChatImageDisplayUrl(imageUrl) }}
            style={styles.image}
            contentFit="contain"
          />
        </Pressable>

        <Pressable
          style={[styles.closeButton, { top: insets.top + 32 }]}
          onPress={onClose}
          accessibilityLabel="关闭"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
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
  imageWrap: {
    zIndex: 1,
    maxWidth: '100%',
    paddingHorizontal: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    elevation: 2,
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
    maxHeight: '85%',
  },
})
