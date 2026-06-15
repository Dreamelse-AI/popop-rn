import { useCallback, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'

import { ensureCharacterFriend } from '../lib/ensure-character-friend'

type Nav = NativeStackNavigationProp<RootStackParamList>

export function useOpenCharacterChat() {
  const navigation = useNavigation<Nav>()
  const openingRef = useRef<string | null>(null)

  return useCallback(
    async (characterId: string) => {
      if (!characterId || openingRef.current) return

      openingRef.current = characterId
      try {
        await ensureCharacterFriend(characterId)
        navigation.navigate('CharacterChat', { characterId })
      } catch (error) {
        console.error('[useOpenCharacterChat] failed:', error)
      } finally {
        if (openingRef.current === characterId) {
          openingRef.current = null
        }
      }
    },
    [navigation],
  )
}
