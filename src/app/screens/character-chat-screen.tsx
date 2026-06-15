import { useCallback } from 'react'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { CharacterChatPage } from '@/pages/chat/character-chat-page'

type Nav = NativeStackNavigationProp<RootStackParamList, 'CharacterChat'>
type Route = RouteProp<RootStackParamList, 'CharacterChat'>

export function CharacterChatScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { characterId } = route.params

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleOpenProfile = useCallback(
    (id: string) => {
      navigation.navigate('CharacterProfile', { characterId: id })
    },
    [navigation],
  )

  return (
    <CharacterChatPage
      characterId={characterId}
      onBack={handleBack}
      onOpenProfile={handleOpenProfile}
    />
  )
}
