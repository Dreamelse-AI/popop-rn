import { useRoute, type RouteProp } from '@react-navigation/native'
import type { RootStackParamList } from '../navigation'
import { CharacterCreateFormPage } from '@/pages/character-creation/edit/character-create-form-page'

type Route = RouteProp<RootStackParamList, 'CharacterCreate'>

export function CharacterCreateScreen() {
  const route = useRoute<Route>()
  const draftId = route.params?.draftId

  return <CharacterCreateFormPage draftId={draftId} />
}
