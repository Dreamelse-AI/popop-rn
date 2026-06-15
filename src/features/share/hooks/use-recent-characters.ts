import { useEffect, useMemo, useRef, useState } from 'react'

import { friendshipApi } from '@/features/friendship/api'
import { mapFriendshipList } from '@/features/friendship/mapper'
import type { CharacterListItem } from '@/pages/home/messages/types'

type UseRecentCharactersResult = {
  items: CharacterListItem[]
  loading: boolean
  error: boolean
}

export function useRecentCharacters(enabled: boolean, limit = 20, keyword = ''): UseRecentCharactersResult {
  const [allItems, setAllItems] = useState<CharacterListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(false)

    void (async () => {
      try {
        const resp = await friendshipApi.listFriends(limit)
        if (requestId !== requestIdRef.current) return
        setAllItems(mapFriendshipList(resp).slice(0, limit))
      } catch (e) {
        if (requestId !== requestIdRef.current) return
        console.error('[useRecentCharacters] fetch failed:', e)
        setError(true)
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    })()
  }, [enabled, limit])

  const items = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter(c => c.name.toLowerCase().includes(q))
  }, [allItems, keyword])

  return { items, loading, error }
}
