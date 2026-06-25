import { View, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { cdnImage } from '@/shared/lib/cdn'
import { LOGO_POPOP_PNG } from '@/shared/assets/feed'

const LogoPopop = LOGO_POPOP_PNG
const IconSearch = cdnImage('assets/feed/icon/Frame_2117132466-1.png')

type TopNavBarProps = {
  onSearchPress: () => void
}

export function TopNavBar({ onSearchPress }: TopNavBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image source={{ uri: LogoPopop }} style={{width: 190, height: 30}} />
      </View>

      <Pressable
        onPress={onSearchPress}
        style={styles.searchButton}
        accessibilityLabel="搜索"
        accessibilityRole="button"
      >
        <Image source={{ uri: IconSearch }} style={{width: 36, height: 36}} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    backgroundColor: '#f7f7f7',
  },
  logoWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
})
