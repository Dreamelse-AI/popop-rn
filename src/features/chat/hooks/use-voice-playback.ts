import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudioPlayer, type AudioPlayer } from 'expo-audio'

export type VoicePlaybackControls = {
  play: (messageId: string, url: string) => void
  stop: () => void
  playingMessageId: string | null
}

export function useVoicePlayback(): VoicePlaybackControls {
  const player = useAudioPlayer(null)
  const playingIdRef = useRef<string | null>(null)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        playingIdRef.current = null
        setPlayingMessageId(null)
      }
    })
    return () => subscription.remove()
  }, [player])

  const stop = useCallback(() => {
    player.pause()
    player.seekTo(0)
    playingIdRef.current = null
    setPlayingMessageId(null)
  }, [player])

  const play = useCallback(
    async (messageId: string, url: string) => {
      if (!url) return

      if (playingIdRef.current === messageId) {
        stop()
        return
      }

      stop()

      try {
        player.replace({ uri: url })
        player.play()
        playingIdRef.current = messageId
        setPlayingMessageId(messageId)
      } catch {
        stop()
      }
    },
    [player, stop],
  )

  useEffect(() => () => { stop() }, [stop])

  return { play, stop, playingMessageId }
}
