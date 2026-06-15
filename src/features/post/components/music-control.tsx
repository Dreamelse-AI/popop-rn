import { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Svg, { Path, Line } from 'react-native-svg'

import IconMusic from '@/shared/assets/feed/icon/音乐 1.svg'

type MusicControlProps = {
  musicName: string
}

function MuteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={23} y1={9} x2={17} y2={15} stroke="white" strokeWidth={2} strokeLinecap="round" />
      <Line x1={17} y1={9} x2={23} y2={15} stroke="white" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function VolumeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.54 8.46a5 5 0 010 7.07" stroke="white" strokeWidth={2} strokeLinecap="round" />
      <Path d="M19.07 4.93a10 10 0 010 14.14" stroke="white" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

export function MusicControl({ musicName }: MusicControlProps) {
  const [expanded, setExpanded] = useState(false)
  const [muted, setMuted] = useState(false)

  const handleDiscClick = useCallback(() => {
    setExpanded(true)
  }, [])

  const handleMuteToggle = useCallback(() => {
    setMuted(m => !m)
  }, [])

  const handleCollapse = useCallback(() => {
    setExpanded(false)
  }, [])

  if (!expanded) {
    return (
      <Pressable
        onPress={handleDiscClick}
        style={styles.discButton}
        accessibilityLabel="Music"
      >
        {muted ? (
          <MuteIcon />
        ) : (
          <IconMusic width={16} height={16} />
        )}
      </Pressable>
    )
  }

  return (
    <Pressable onPress={handleCollapse} style={styles.pill}>
      <View style={[styles.musicInfo, muted && styles.mutedOpacity]}>
        <IconMusic width={16} height={16} />
        <Text style={styles.musicName} numberOfLines={1}>{musicName}</Text>
      </View>
      <Pressable
        onPress={handleMuteToggle}
        style={styles.muteButton}
        accessibilityLabel={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <MuteIcon /> : <VolumeIcon />}
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  discButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(48,48,48,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(48,48,48,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  mutedOpacity: {
    opacity: 0.2,
  },
  musicName: {
    maxWidth: 69,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  muteButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
