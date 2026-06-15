import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CharacterShareButton } from '@/features/share'

import IconClose from '@/shared/assets/character/main/character-close.svg'

import { CHARACTER_PROFILE_HEADER_HEIGHT } from './character-profile-scroll'

export type CharacterFixedNavHeaderProps = {
  characterId: string
  characterName: string
  onClose: () => void
  bgColor?: string
  iconTone?: 'default' | 'light'
}

export function CharacterFixedNavHeader({
  characterId,
  characterName,
  onClose,
  bgColor = '#f7f7f7',
  iconTone = 'default',
}: CharacterFixedNavHeaderProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: bgColor }]}>
      <Pressable onPress={onClose} style={styles.button} accessibilityLabel="关闭">
        <IconClose width={36} height={36} />
      </Pressable>

      <CharacterShareButton
        characterId={characterId}
        characterName={characterName}
        iconTone={iconTone}
      />
    </View>
  )
}

export function characterFixedNavHeaderOffsetHeight(safeTop: number): number {
  return CHARACTER_PROFILE_HEADER_HEIGHT + safeTop
}

const styles = StyleSheet.create({
  container: {
    height: CHARACTER_PROFILE_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 30,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
