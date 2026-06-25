import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native'
import Svg, { Path, Line } from 'react-native-svg'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'

import IconMusic from '@/shared/assets/feed/icon/音乐 1.svg'

type MusicControlProps = {
  musicName: string
  musicUrl?: string
  expanded?: boolean
  isDark?: boolean
  onExpandChange?: (expanded: boolean) => void
  /** BGM 加载状态变化：加载中 true / 可播放或无 BGM false。story 用它来暂停进度条 */
  onLoadingChange?: (loading: boolean) => void
}

export type MusicControlHandle = {
  pause: () => void
  resume: () => void
}

function MuteIcon({ color = 'white' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={23} y1={9} x2={17} y2={15} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={17} y1={9} x2={23} y2={15} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function VolumeIcon({ color = 'white' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.54 8.46a5 5 0 010 7.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M19.07 4.93a10 10 0 010 14.14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

export const MusicControl = forwardRef<MusicControlHandle, MusicControlProps>(
  function MusicControl({ musicName, musicUrl, expanded = false, isDark = true, onExpandChange, onLoadingChange }, ref) {
    const iconColor = 'white'
    const bgColor = 'rgba(48,48,48,0.9)'
    const textColor = 'rgba(255,255,255,0.8)'
    const [muted, setMuted] = useState(true)
    const [pausedByViewer, setPausedByViewer] = useState(false)
    const userMutedRef = useRef(false)
    const playedRef = useRef(false)
    const spinValue = useRef(new Animated.Value(0)).current
    const spinAnim = useRef<Animated.CompositeAnimation | null>(null)

    const player = useAudioPlayer(musicUrl ? { uri: musicUrl } : null)
    const status = useAudioPlayerStatus(player)
    const isLoaded = status?.isLoaded ?? false

    useImperativeHandle(ref, () => ({
      pause: () => {
        player.pause()
        setPausedByViewer(true)
      },
      resume: () => {
        if (userMutedRef.current) return
        if (pausedByViewer) {
          player.play()
          setPausedByViewer(false)
        }
      },
    }), [player, pausedByViewer])

    // 切换 BGM 时重置为「加载中」状态：静音、不转动，并通知外部暂停进度条
    useEffect(() => {
      playedRef.current = false
      if (!musicUrl) {
        setMuted(true)
        onLoadingChange?.(false)
        return
      }
      player.loop = true
      setMuted(true)
      setPausedByViewer(false)
      onLoadingChange?.(userMutedRef.current ? false : true)
    }, [musicUrl, player, onLoadingChange])

    // BGM 可播放后：若用户未主动静音则自动播放并转动；通知外部恢复进度条
    useEffect(() => {
      if (!musicUrl) return
      if (!isLoaded) return
      if (playedRef.current) return
      playedRef.current = true
      if (userMutedRef.current) {
        setMuted(true)
        onLoadingChange?.(false)
        return
      }
      player.play()
      setMuted(false)
      onLoadingChange?.(false)
    }, [isLoaded, musicUrl, player, onLoadingChange])

    const isPlaying = !muted && !pausedByViewer

    useEffect(() => {
      if (isPlaying) {
        const anim = Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        )
        spinAnim.current = anim
        anim.start()
      } else {
        spinAnim.current?.stop()
        spinAnim.current = null
        spinValue.setValue(0)
      }
    }, [isPlaying, spinValue])

    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    })

    const handleDiscClick = useCallback(() => {
      onExpandChange?.(true)
    }, [onExpandChange])

    const handleMuteToggle = useCallback(() => {
      if (muted) {
        player.play()
        setMuted(false)
        userMutedRef.current = false
      } else {
        player.pause()
        setMuted(true)
        userMutedRef.current = true
      }
    }, [muted, player])

    if (!expanded) {
      return (
        <Pressable onPress={handleDiscClick} style={[styles.discButton, { backgroundColor: bgColor }]} accessibilityLabel="Music">
          <Animated.View style={{ transform: [{ rotate: isPlaying ? spin : '0deg' }] }}>
            {muted ? <MuteIcon color={iconColor} /> : <IconMusic width={16} height={16} />}
          </Animated.View>
        </Pressable>
      )
    }

    return (
      <View style={[styles.pill, { backgroundColor: bgColor }]}>
        <View style={[styles.musicInfo, muted && styles.mutedOpacity]}>
          <Animated.View style={{ transform: [{ rotate: isPlaying ? spin : '0deg' }] }}>
            <IconMusic width={16} height={16} />
          </Animated.View>
          <Text style={[styles.musicName, { color: textColor }]} numberOfLines={1}>{musicName}</Text>
        </View>
        <Pressable onPress={handleMuteToggle} style={styles.muteButton} accessibilityLabel={muted ? 'Unmute' : 'Mute'}>
          {muted ? <MuteIcon color={iconColor} /> : <VolumeIcon color={iconColor} />}
        </Pressable>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  discButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 100,
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
  },
  muteButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
