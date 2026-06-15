import { useCallback, useEffect, useState } from 'react'
import { useAudioPlayer } from 'expo-audio'

type Listener = () => void

let currentPlayerSource: { uri: string } | null = null
let playingPostId: string | null = null
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach(listener => listener())
}

export function getPlayingPostBgmId(): string | null {
  return playingPostId
}

export async function stopPostBgm() {
  currentPlayerSource = null
  playingPostId = null
  notify()
}

export async function playPostBgm(postId: string, url: string) {
  if (!url) return
  await stopPostBgm()
  currentPlayerSource = { uri: url }
  playingPostId = postId
  notify()
}

function subscribePostBgm(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function usePostBgmPlayer() {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(getPlayingPostBgmId())
  const player = useAudioPlayer(currentPlayerSource)

  useEffect(() => {
    const unsubscribe = subscribePostBgm(() => {
      setCurrentPlayingId(getPlayingPostBgmId())
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (currentPlayerSource && currentPlayingId) {
      player.play()
    }
  }, [currentPlayingId, player])

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        void stopPostBgm()
      }
    })
    return () => subscription.remove()
  }, [player])

  const play = useCallback((postId: string, url: string) => {
    void playPostBgm(postId, url)
  }, [])

  const stop = useCallback(() => {
    void stopPostBgm()
  }, [])

  return { playingPostId: currentPlayingId, play, stop }
}
