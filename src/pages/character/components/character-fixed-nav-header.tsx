import { View, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cdnImage } from '@/shared/lib/cdn'

import { CharacterShareButton } from '@/features/share'

const IconClose = cdnImage('assets/character/main/character-close.png')

import {
  CHARACTER_PROFILE_HEADER_HEIGHT,
  getCharacterProfileHeroTopOffset,
} from './character-profile-scroll'

export type CharacterFixedNavHeaderProps = {
  characterId: string
  characterName: string
  onClose: () => void
  /** bar：实体顶栏；overlay：无背景、浮在 WebView 内容之上 */
  variant?: 'bar' | 'overlay'
  /** 顶栏背景，仅 bar 模式生效 */
  bgColor?: string
  /** 深色背景页使用浅色图标 */
  iconTone?: 'default' | 'light'
}

export function CharacterFixedNavHeader({
  characterId,
  characterName,
  onClose,
  variant = 'bar',
  bgColor = '#f7f7f7',
  iconTone = 'default',
}: CharacterFixedNavHeaderProps) {
  const insets = useSafeAreaInsets()
  const isOverlay = variant === 'overlay'

  return (
    <View
      pointerEvents={isOverlay ? 'box-none' : 'auto'}
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: CHARACTER_PROFILE_HEADER_HEIGHT + insets.top,
          backgroundColor: isOverlay ? 'transparent' : bgColor,
        },
      ]}
    >
      <Pressable
        onPress={onClose}
        style={styles.button}
        accessibilityLabel="关闭"
        pointerEvents="auto"
      >
        <Image source={{ uri: IconClose }} style={{width: 36, height: 36}} />
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
  return getCharacterProfileHeroTopOffset(safeTop)
}

/** 顶导总高度（px）：导航条 + safe-area top */
export function getCharacterFixedNavHeightPx(safeTop: number): number {
  return CHARACTER_PROFILE_HEADER_HEIGHT + safeTop
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
