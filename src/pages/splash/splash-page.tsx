import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import type { RootStackParamList } from '@/app/navigation'
import { PopopLogo } from '@/shared/assets/popop-logo'
import { useAuthStore } from '@/features/auth/auth-store'

type SplashNav = NativeStackNavigationProp<RootStackParamList, 'Splash'>

export function SplashPage() {
  const navigation = useNavigation<SplashNav>()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        navigation.replace('Home')
      } else {
        navigation.replace('Login')
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [navigation, isLoggedIn])

  return (
    <LinearGradient
      colors={['#fbf2d8', '#ffffff']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <PopopLogo width={169} height={133} />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
