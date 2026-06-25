import { useCallback } from 'react'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import { CharacterDetailPage } from '@/pages/character/character-detail-page'
import { markReopenCharacterDrawer } from '@/pages/home/messages/drawer-return-flag'

type Nav = NativeStackNavigationProp<RootStackParamList, 'CharacterDetail'>
type Route = RouteProp<RootStackParamList, 'CharacterDetail'>

export function CharacterDetailScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { characterId, source, impressionId, closeTo } = route.params

  const handleClose = useCallback(() => {
    // 仅匿名匹配加好友成功跳转而来时：关闭回到聊天页的角色抽屉（匹配入口）
    if (closeTo === 'characterDrawer') {
      markReopenCharacterDrawer()
      navigation.navigate('Home')
      return
    }
    navigation.goBack()
  }, [navigation, closeTo])

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
