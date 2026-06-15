import { useCallback, useEffect, useRef, useState } from 'react'

import { characterApi } from '../api'
import { mapCopyableToAddableCharacters } from '../mapper'
import type { AddableCharacterItem } from '../types'

type UseAddableCharactersResult = {
  items: AddableCharacterItem[]
  loading: boolean
  error: boolean
  refresh: () => Promise<void>
}

export function useAddableCharacters(enabled: boolean): UseAddableCharactersResult {
  const [items, setItems] = useState<AddableCharacterItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const requestIdRef = useRef(0)

  const fetchList = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(false)

    try {
      const resp = await characterApi.listCopyable()
      if (requestId !== requestIdRef.current) return
      setItems(mapCopyableToAddableCharacters(resp))
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      console.error('[useAddableCharacters] fetch failed:', e)
      setError(true)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void fetchList()
  }, [enabled, fetchList])

  return { items, loading, error, refresh: fetchList }
}
