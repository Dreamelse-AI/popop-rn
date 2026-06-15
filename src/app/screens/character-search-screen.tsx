import { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { CharacterSearchPage } from '@/pages/character/character-search-page'

type Nav = NativeStackNavigationProp<RootStackParamList, 'CharacterSearch'>

export function CharacterSearchScreen() {
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

  return (
    <CharacterSearchPage
      onClose={handleClose}
      onSelectCharacter={handleSelectCharacter}
    />
  )
}
