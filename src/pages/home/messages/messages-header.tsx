import { View, Pressable, StyleSheet } from 'react-native'

import LogoPopop from '@/shared/assets/feed/icon/Group 2117132529.svg'
import IconSearch from '@/shared/assets/feed/icon/Frame 2117132466-1.svg'
import IconMenu from '@/shared/assets/character/back.svg'

type MessagesHeaderProps = {
  onMenuPress?: () => void
  onSearchPress?: () => void
}

export function MessagesHeader({ onMenuPress, onSearchPress }: MessagesHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onMenuPress} style={styles.leftButton} accessibilityLabel="菜单">
        <IconMenu width={36} height={36} />
      </Pressable>

      <View style={styles.logoWrapper}>
        <LogoPopop width={190} height={30} />
      </View>

      <Pressable onPress={onSearchPress} style={styles.rightButton} accessibilityLabel="搜索">
        <IconSearch width={36} height={36} />
      </Pressable>
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
  rightButton: {
    position: 'absolute',
    right: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
