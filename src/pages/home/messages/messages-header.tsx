import { View, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { cdnImage } from '@/shared/lib/cdn'
import { LOGO_POPOP_PNG } from '@/shared/assets/feed'

const LogoPopop = LOGO_POPOP_PNG
const IconMenu = cdnImage('assets/character/back.png')

type MessagesHeaderProps = {
  onMenuPress?: () => void
}

export function MessagesHeader({ onMenuPress }: MessagesHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onMenuPress} style={styles.leftButton} accessibilityLabel="菜单">
        <Image source={{ uri: IconMenu }} style={{width: 36, height: 36}} />
      </Pressable>

      <View style={styles.logoWrapper}>
        <Image source={{ uri: LogoPopop }} style={{width: 190, height: 30}} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 12,
  },
  leftButton: {
    position: 'absolute',
    left: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
