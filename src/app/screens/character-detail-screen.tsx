import { useCallback } from 'react'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { CharacterDetailPage } from '@/pages/character/character-detail-page'

type Nav = NativeStackNavigationProp<RootStackParamList, 'CharacterDetail'>
type Route = RouteProp<RootStackParamList, 'CharacterDetail'>

export function CharacterDetailScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { characterId, source, impressionId } = route.params

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleGoChat = useCallback(() => {
    navigation.navigate('CharacterChat', { characterId })
  }, [navigation, characterId])

  return (
    <CharacterDetailPage
      characterId={characterId}
      source={source}
      impressionId={impressionId}
      onClose={handleClose}
      onGoChat={handleGoChat}
    />
  )
}
