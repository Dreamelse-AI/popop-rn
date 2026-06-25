import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { cdnImage } from '@/shared/lib/cdn'

const IconBack = cdnImage('assets/icon-back.png')
const IconMenu = cdnImage('assets/dialog/dialog-topright-back.png')

type ChatHeaderProps = {
  name: string
  characterAka: string
  onBack: () => void
  onProfilePress?: () => void
  onMenuPress?: () => void
}

export function ChatHeader({
  name,
  characterAka,
  onBack,
  onProfilePress,
  onMenuPress,
}: ChatHeaderProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: Math.max(10, insets.top) }]}>
      <View style={styles.left}>
        <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="返回">
          <Image source={{ uri: IconBack }} style={{width: 36, height: 36}} />
        </Pressable>

        <View style={styles.nameRow}>
          <Pressable onPress={onProfilePress}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
          </Pressable>

          <View style={styles.akaBadge}>
            <Text style={styles.akaText} numberOfLines={1}>{characterAka}</Text>
          </View>
        </View>
      </View>

      <Pressable onPress={onMenuPress} style={styles.menuButton} accessibilityLabel="菜单">
        <Image source={{ uri: IconMenu }} style={{width: 36, height: 36}} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flex: 1,
  },
  name: {
    fontSize: 20,
    lineHeight: 20,
    fontFamily: 'Black Han Sans',
    color: '#000000',
    flexShrink: 1,
  },
  akaBadge: {
    height: 24,
    minWidth: 67,
    maxWidth: 120,
    borderRadius: 12,
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  akaText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: '#ffffff',
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
