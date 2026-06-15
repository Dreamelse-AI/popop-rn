import { useCallback } from 'react'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { AddCharacterPage } from '@/pages/character/add-character-page'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddCharacter'>

export function AddCharacterScreen() {
  const navigation = useNavigation<Nav>()

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleSelectCharacter = useCallback(
    (characterId: string) => {
      navigation.navigate('CharacterChat', { characterId })
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
