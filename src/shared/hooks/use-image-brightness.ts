import { useEffect, useState } from 'react'
import { Image } from 'react-native'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '')
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16)
    const g = parseInt(cleaned[1] + cleaned[1], 16)
    const b = parseInt(cleaned[2] + cleaned[2], 16)
    return { r, g, b }
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16)
    const g = parseInt(cleaned.slice(2, 4), 16)
    const b = parseInt(cleaned.slice(4, 6), 16)
    return { r, g, b }
  }
  return null
}

function computeBrightness(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function useImageBrightness(imageUrl: string | undefined, bkgMainColor?: string): 'light' | 'dark' {
  const [brightness, setBrightness] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    if (!imageUrl) {
      setBrightness('dark')
      return
    }

    if (bkgMainColor) {
      const rgb = hexToRgb(bkgMainColor)
      if (rgb) {
        const val = computeBrightness(rgb.r, rgb.g, rgb.b)
        setBrightness(val > 128 ? 'light' : 'dark')
        return
      }
    }

    // 无颜色信息时，通过图片尺寸做启发式判断：
    // 大部分聊天背景为深色，默认 dark
    // 如果后续需要精确检测可接入 expo-image-manipulator
    Image.getSize(
      imageUrl,
      () => {
        // 图片加载成功但无法分析像素，保持默认
        setBrightness('dark')
      },
      () => {
        setBrightness('dark')
      },
    )
  }, [imageUrl, bkgMainColor])

  return brightness
}
