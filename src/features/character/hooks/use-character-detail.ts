import { useCallback, useEffect, useRef, useState } from 'react'

import { characterApi } from '../api'
import { mapCharacterDetailPage } from '../mapper'
import type { CharacterDetailPageData, CharacterDetailSource } from '../types'

export type UseCharacterDetailOptions = {
  source?: CharacterDetailSource
  impressionId?: string
}

type UseCharacterDetailResult = {
  data: CharacterDetailPageData | null
  loading: boolean
  error: boolean
  refresh: () => Promise<void>
}

export function useCharacterDetail(
  characterId: string,
  options: UseCharacterDetailOptions = {},
): UseCharacterDetailResult {
  const { source = 'direct', impressionId } = options
  const [data, setData] = useState<CharacterDetailPageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const requestIdRef = useRef(0)

  const fetchDetail = useCallback(async () => {
    if (!characterId) return

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(false)

    try {
      const resp = await characterApi.getDetail({
        character_id: characterId,
        source,
        ...(impressionId ? { impression_id: impressionId } : {}),
      })
      if (requestId !== requestIdRef.current) return

      const mapped = mapCharacterDetailPage(resp)
      if (!mapped.htmlContent) {
        setError(true)
        setData(null)
        return
      }

      setData(mapped)
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      console.error('[useCharacterDetail] fetch failed:', e)
      setError(true)
      setData(null)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [characterId, impressionId, source])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  return { data, loading, error, refresh: fetchDetail }
}
