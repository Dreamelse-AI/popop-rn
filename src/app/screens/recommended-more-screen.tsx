import { useCallback } from 'react'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { RecommendedMorePage } from '@/pages/home/recommended-more/recommended-more-page'

type Nav = NativeStackNavigationProp<RootStackParamList, 'RecommendedMore'>
type Route = RouteProp<RootStackParamList, 'RecommendedMore'>

export function RecommendedMoreScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return (
    <RecommendedMorePage
      featuredCharacters={route.params?.featuredCharacters ?? []}
      onBack={handleBack}
    />
  )
}
