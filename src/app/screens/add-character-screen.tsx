import { useCallback, useRef } from 'react'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { AddCharacterPage } from '@/pages/character/add-character-page'
import { ensureCharacterFriend } from '@/features/friendship/lib/ensure-character-friend'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddCharacter'>

export function AddCharacterScreen() {
  const navigation = useNavigation<Nav>()
  const selectingRef = useRef(false)

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleSelectCharacter = useCallback(
    async (characterId: string) => {
      if (selectingRef.current) return
      selectingRef.current = true
      try {
        // 进聊天页前先确保已加为好友（未加则调 /friendship/add）
        await ensureCharacterFriend(characterId)
        navigation.navigate('CharacterChat', { characterId })
      } catch (e) {
        console.error('[AddCharacterScreen] add friend failed:', e)
      } finally {
        selectingRef.current = false
      }
    },
    [navigation],
  )

  const handleOpenSearch = useCallback(() => {
    navigation.navigate('CharacterSearch')
  }, [navigation])

  return (
    <AddCharacterPage
      onClose={handleClose}
      onSelectCharacter={handleSelectCharacter}
      onOpenSearch={handleOpenSearch}
    />
  )
}
