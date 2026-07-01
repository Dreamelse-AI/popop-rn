import { useEffect, useState } from 'react'

import VoiceFrame1 from '@/shared/assets/dialog/voice_play/1.svg'
import VoiceFrame2 from '@/shared/assets/dialog/voice_play/2.svg'
import VoiceFrame3 from '@/shared/assets/dialog/voice_play/3.svg'

const FRAMES = [VoiceFrame1, VoiceFrame2, VoiceFrame3] as const
const FRAME_INTERVAL_MS = 350

type VoicePlayingIconProps = {
  isPlaying: boolean
  size?: number
  color?: string
}

/** 角色语音气泡播放图标：播放时循环切换三帧声波动画，静止时显示满格喇叭 */
export function VoicePlayingIcon({ isPlaying, size = 20, color = '#000' }: VoicePlayingIconProps) {
  const [frame, setFrame] = useState(FRAMES.length - 1)

  useEffect(() => {
    if (!isPlaying) {
      setFrame(FRAMES.length - 1)
      return
    }
    setFrame(0)
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % FRAMES.length)
    }, FRAME_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isPlaying])

  const Frame = FRAMES[frame]
  return <Frame width={size} height={size} color={color} fill={color} />
}
