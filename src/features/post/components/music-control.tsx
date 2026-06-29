import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path, Line } from 'react-native-svg'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { cdnImage } from '@/shared/lib/cdn'

const IconMusic = cdnImage('assets/feed/icon/music_1.png')

type MusicControlProps = {
  musicName: string
  musicUrl?: string
  expanded?: boolean
  isDark?: boolean
  onExpandChange?: (expanded: boolean) => void
  /** BGM 加载状态变化：加载中 true / 可播放或无 BGM false。story 用它来暂停进度条 */
  onLoadingChange?: (loading: boolean) => void
  /** 用户通过胶囊手动恢复音乐播放 */
  onUserPlay?: () => void
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
  function MusicControl({ musicName, musicUrl, expanded = false, isDark = true, onExpandChange, onLoadingChange, onUserPlay }, ref) {
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

    // 对齐 web：切换 BGM（musicUrl 变化）时重置为「加载中」：静音、回到开头，并通知外部暂停进度条。
    // 真正放行交给下面的 isLoaded effect（或用户已主动静音则立即放行）。
    useEffect(() => {
      playedRef.current = false
      if (!musicUrl) {
        setMuted(true)
        onLoadingChange?.(false)
        return
      }
      player.loop = true
      void Promise.resolve(player.seekTo(0)).catch(() => {})
      setPausedByViewer(false)
      setMuted(true)
      if (userMutedRef.current) {
        onLoadingChange?.(false)
        return
      }
      onLoadingChange?.(true)
    }, [musicUrl, player, onLoadingChange])

    // 对齐 web：BGM 可播放后，若用户未主动静音则从头播放并转动，并通知外部恢复进度条
    useEffect(() => {
      if (!musicUrl) return
      if (!isLoaded) return
      if (playedRef.current) return
      if (userMutedRef.current) return
      playedRef.current = true
      void Promise.resolve(player.seekTo(0)).catch(() => {})
      player.play()
      setMuted(false)
      onLoadingChange?.(false)
    }, [isLoaded, musicUrl, player, onLoadingChange])

    const isPlaying = !muted && !pausedByViewer

    useEffect(() => {
      if (isPlaying) {
        spinValue.setValue(0)
        const anim = Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        )
        spinAnim.current = anim
        anim.start()
        return () => {
          anim.stop()
          spinValue.setValue(0)
        }
      } else {
        spinAnim.current?.stop()
        spinAnim.current = null
        spinValue.setValue(0)
      }
    }, [isPlaying, spinValue])

    // 不播放时强制归零（防止 effect 时序问题导致卡在非零角度）
    if (!isPlaying) {
      spinValue.setValue(0)
    }

    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    })

    const handleDiscClick = useCallback(() => {
      onExpandChange?.(true)
    }, [onExpandChange])

    const handleMuteToggle = useCallback(() => {
      if (!isPlaying) {
        player.play()
        setMuted(false)
        setPausedByViewer(false)
        userMutedRef.current = false
        onUserPlay?.()
      } else {
        player.pause()
        setMuted(true)
        userMutedRef.current = true
      }
    }, [isPlaying, player, onUserPlay])

    if (!expanded) {
      return (
        <Pressable onPress={handleDiscClick} style={[styles.discButton, { backgroundColor: bgColor }]} accessibilityLabel="Music">
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            {isPlaying ? <Image source={{ uri: IconMusic }} style={{width: 16, height: 16}} /> : <MuteIcon color={iconColor} />}
          </Animated.View>
        </Pressable>
      )
    }

    return (
      <View style={[styles.pill, { backgroundColor: bgColor }]}>
        <View style={[styles.musicInfo, !isPlaying && styles.mutedOpacity]}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Image source={{ uri: IconMusic }} style={{width: 16, height: 16}} />
          </Animated.View>
          <Text style={[styles.musicName, { color: textColor }]} numberOfLines={1}>{musicName}</Text>
        </View>
        <Pressable onPress={handleMuteToggle} style={styles.muteButton} accessibilityLabel={isPlaying ? 'Mute' : 'Unmute'}>
          {isPlaying ? <VolumeIcon color={iconColor} /> : <MuteIcon color={iconColor} />}
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
