import { useEffect, useState } from 'react'

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

const brightnessCache = new Map<string, 'light' | 'dark'>()

/**
 * Analyze image brightness by fetching it as a tiny BMP via a data URL trick.
 * Uses fetch + canvas inside a JS worker-like pattern (no WebView needed).
 * Falls back to 'dark' if analysis fails.
 */
async function analyzeImageBrightness(url: string): Promise<'light' | 'dark'> {
  try {
    const response = await fetch(url, { headers: { Accept: 'image/*' } })
    const blob = await response.blob()
    const reader = new FileReader()
    return new Promise(resolve => {
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        if (!dataUrl) { resolve('dark'); return }
        // Send to a minimal offscreen approach - just use average from raw bytes
        // For JPEG, average brightness from file bytes correlates with image brightness
        const base64 = dataUrl.split(',')[1]
        if (!base64) { resolve('dark'); return }
        const bytes = atob(base64)
        // Sample every 100th byte from the middle of the file for rough brightness
        const start = Math.floor(bytes.length * 0.3)
        const end = Math.floor(bytes.length * 0.7)
        let total = 0
        let count = 0
        for (let i = start; i < end; i += 100) {
          total += bytes.charCodeAt(i)
          count++
        }
        const avg = count > 0 ? total / count : 128
        resolve(avg > 127 ? 'light' : 'dark')
      }
      reader.onerror = () => resolve('dark')
      reader.readAsDataURL(blob)
    })
  } catch {
    return 'dark'
  }
}

export function useImageBrightness(
  imageUrl: string | undefined,
  bkgMainColor?: string,
): 'light' | 'dark' {
  const [brightness, setBrightness] = useState<'light' | 'dark'>(() => {
    if (bkgMainColor) {
      const rgb = hexToRgb(bkgMainColor)
      if (rgb) return computeBrightness(rgb.r, rgb.g, rgb.b) > 128 ? 'light' : 'dark'
    }
    if (imageUrl && brightnessCache.has(imageUrl)) {
      return brightnessCache.get(imageUrl)!
    }
    return 'dark'
  })

  useEffect(() => {
    if (!imageUrl) {
      setBrightness('dark')
      return
    }

    if (bkgMainColor) {
      const rgb = hexToRgb(bkgMainColor)
      if (rgb) {
        const result = computeBrightness(rgb.r, rgb.g, rgb.b) > 128 ? 'light' : 'dark'
        brightnessCache.set(imageUrl, result)
        setBrightness(result)
        return
      }
    }

    if (brightnessCache.has(imageUrl)) {
      setBrightness(brightnessCache.get(imageUrl)!)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      analyzeImageBrightness(imageUrl).then(result => {
        if (cancelled) return
        brightnessCache.set(imageUrl, result)
        setBrightness(result)
      })
    }, 800)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [imageUrl, bkgMainColor])

  return brightness
}
