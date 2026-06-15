import { useCallback, useEffect, useRef, useState } from 'react'

import { characterApi } from '../api'
import { mapCopyableToSearchItems } from '../mapper'
import type { CharacterSearchItem } from '../types'

type UseCharacterSearchResult = {
  items: CharacterSearchItem[]
  loading: boolean
  error: boolean
  searched: boolean
}

const DEBOUNCE_MS = 300

export function useCharacterSearch(keyword: string): UseCharacterSearchResult {
  const [items, setItems] = useState<CharacterSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [searched, setSearched] = useState(false)
  const requestIdRef = useRef(0)

  const runSearch = useCallback(async (kw: string) => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(false)

    try {
      const resp = await characterApi.listCopyable(30, kw)
      if (requestId !== requestIdRef.current) return
      setItems(mapCopyableToSearchItems(resp))
      setSearched(true)
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      console.error('[useCharacterSearch] search failed:', e)
      setError(true)
      setSearched(true)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const kw = keyword.trim()
    if (!kw) {
      requestIdRef.current += 1
      setItems([])
      setSearched(false)
      setLoading(false)
      setError(false)
      return
    }

    const timer = setTimeout(() => void runSearch(kw), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [keyword, runSearch])

  return { items, loading, error, searched }
}
