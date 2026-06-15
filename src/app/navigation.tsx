import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { HomeFeedCharacter } from '@/features/feed/feed-types'
import { SplashPage } from '@/pages/splash/splash-page'
import { LoginPage } from '@/pages/auth/login-page'
import { HomePage } from '@/pages/home/home-page'
import { CharacterChatScreen } from './screens/character-chat-screen'
import { CharacterDetailScreen } from './screens/character-detail-screen'
import { CharacterProfileScreen } from './screens/character-profile-screen'
import { AddCharacterScreen } from './screens/add-character-screen'
import { CharacterSearchScreen } from './screens/character-search-screen'
import { CharacterCreateScreen } from './screens/character-create-screen'
import { RecommendedMoreScreen } from './screens/recommended-more-screen'
import { RandomMatchScreen } from './screens/random-match-screen'

export type RootStackParamList = {
  Splash: undefined
  Login: undefined
  Home: undefined
  CharacterChat: { characterId: string }
  CharacterDetail: { characterId: string; source?: string; impressionId?: string }
  CharacterProfile: { characterId: string }
  AddCharacter: undefined
  CharacterSearch: undefined
  CharacterCreate:
    | {
        draftId?: string
        characterId?: string
        mode?: string
      }
    | undefined
  RecommendedMore: { featuredCharacters?: HomeFeedCharacter[] }
  RandomMatch: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashPage} />
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="Home" component={HomePage} />
      <Stack.Screen name="CharacterChat" component={CharacterChatScreen} />
      <Stack.Screen name="CharacterDetail" component={CharacterDetailScreen} />
      <Stack.Screen name="CharacterProfile" component={CharacterProfileScreen} />
      <Stack.Screen name="AddCharacter" component={AddCharacterScreen} />
      <Stack.Screen name="CharacterSearch" component={CharacterSearchScreen} />
      <Stack.Screen name="CharacterCreate" component={CharacterCreateScreen} />
      <Stack.Screen name="RecommendedMore" component={RecommendedMoreScreen} />
      <Stack.Screen name="RandomMatch" component={RandomMatchScreen} />
    </Stack.Navigator>
  )
}
