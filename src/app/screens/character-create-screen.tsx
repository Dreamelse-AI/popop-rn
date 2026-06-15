import { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { CharacterCreatePage } from '@/pages/character/character-create-page'

type Nav = NativeStackNavigationProp<RootStackParamList, 'CharacterCreate'>

export function CharacterCreateScreen() {
  const navigation = useNavigation<Nav>()

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return (
    <CharacterCreatePage onClose={handleClose} />
  )
}
