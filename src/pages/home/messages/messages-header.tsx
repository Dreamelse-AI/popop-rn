import { View, Pressable, StyleSheet } from 'react-native'

import LogoPopop from '@/shared/assets/feed/icon/Group 2117132529.svg'
import IconMenu from '@/shared/assets/character/back.svg'

type MessagesHeaderProps = {
  onMenuPress?: () => void
}

export function MessagesHeader({ onMenuPress }: MessagesHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onMenuPress} style={styles.leftButton} accessibilityLabel="菜单">
        <IconMenu width={36} height={36} />
      </Pressable>

      <View style={styles.logoWrapper}>
        <LogoPopop width={190} height={30} />
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
