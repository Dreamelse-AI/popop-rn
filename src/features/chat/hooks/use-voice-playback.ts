import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudioPlayer } from 'expo-audio'

import { safeAudioPlayerAction } from '../lib/safe-audio-player'

export type VoicePlaybackControls = {
  play: (messageId: string, url: string) => void
  stop: () => void
  /** 当前关联的语音消息（播放中或已暂停） */
  playingMessageId: string | null
  /** 是否正在播放（暂停时为 false） */
  isVoicePlaying: boolean
}

export function useVoicePlayback(): VoicePlaybackControls {
  const player = useAudioPlayer(null)
  const activeIdRef = useRef<string | null>(null)
  const finishedRef = useRef(false)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [isVoicePlaying, setIsVoicePlaying] = useState(false)

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        finishedRef.current = true
        setIsVoicePlaying(false)
      }
    })
    return () => subscription.remove()
  }, [player])

  const stop = useCallback(() => {
    safeAudioPlayerAction(player, () => {
      player.pause()
      player.seekTo(0)
    })
    activeIdRef.current = null
    finishedRef.current = false
    setPlayingMessageId(null)
    setIsVoicePlaying(false)
  }, [player])

  const play = useCallback(
    (messageId: string, url: string) => {
      if (!url) return

      // 再次点击当前语音：在暂停 / 继续之间切换（不从头播放）
      if (activeIdRef.current === messageId && !finishedRef.current) {
        if (player.playing) {
          safeAudioPlayerAction(player, () => player.pause())
          setIsVoicePlaying(false)
        } else {
          safeAudioPlayerAction(player, () => player.play())
          setIsVoicePlaying(true)
        }
        return
      }

      try {
        safeAudioPlayerAction(player, () => {
          player.replace({ uri: url })
          player.seekTo(0)
          player.play()
        })
        activeIdRef.current = messageId
        finishedRef.current = false
        setPlayingMessageId(messageId)
        setIsVoicePlaying(true)
      } catch {
        stop()
      }
    },
    [player, stop],
  )

  useEffect(() => () => { stop() }, [stop])

  return { play, stop, playingMessageId, isVoicePlaying }
}
