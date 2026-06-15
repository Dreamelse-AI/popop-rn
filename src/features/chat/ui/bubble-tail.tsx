import { View, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import type { BubbleTailVariant } from '../lib/chat-atmosphere-presets'

import IconBlackVector from '@/shared/assets/dialog/dialog-page-style-settings/dialogPageStyleSettings-blackVector.svg'
import IconTailYellow from '@/shared/assets/dialog/dialog-pop-down-yellow.svg'
import IconTailWhite from '@/shared/assets/dialog/dialog-pop-down-white.svg'

type BubbleTailProps = {
  variant: BubbleTailVariant
  side: 'left' | 'right'
}

export function BubbleTail({ variant, side }: BubbleTailProps) {
  const positionStyle = side === 'left' ? styles.left : styles.right

  if (variant === 'black') {
    return (
      <View style={[styles.tail, positionStyle]}>
        <IconBlackVector width={19} height={9} />
      </View>
    )
  }

  if (variant === 'yellow') {
    return (
      <View style={[styles.tail, positionStyle]}>
        <IconTailYellow width={19} height={9} />
      </View>
    )
  }

  if (variant === 'white') {
    return (
      <View style={[styles.tail, positionStyle]}>
        <IconTailWhite width={19} height={9} />
      </View>
    )
  }

  return (
    <View style={[styles.tail, positionStyle]}>
      <Svg width={19} height={9} viewBox="0 0 19 9">
        <Path
          d="M18.299 8.52186C20.715 8.52186 12.5366 5.27452 14.6474 0L0 0C0 0 1.4529 3.71254 5.52495 6.18464C9.597 8.65674 15.883 8.52186 18.299 8.52186Z"
          fill="#D7F0FF"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  tail: {
    position: 'absolute',
    bottom: -9,
    width: 19,
    height: 9,
  },
  left: {
    left: 0,
  },
  right: {
    right: 0,
  },
})
