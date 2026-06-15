import { useCallback } from 'react'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { CharacterProfilePage } from '@/pages/character/character-profile-page'

type Nav = NativeStackNavigationProp<RootStackParamList, 'CharacterProfile'>
type Route = RouteProp<RootStackParamList, 'CharacterProfile'>

export function CharacterProfileScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { characterId } = route.params

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleOpenDetail = useCallback(() => {
    navigation.navigate('CharacterDetail', { characterId })
  }, [navigation, characterId])

  return (
    <CharacterProfilePage
      characterId={characterId}
      onClose={handleClose}
      onOpenDetail={handleOpenDetail}
    />
  )
}
