import { useEffect } from 'react'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import type { RootStackParamList } from '@/app/navigation'
import {
  AuthLoginShell,
  createAuthLoginShellPlaceholders,
} from '@/pages/auth/auth-login-shell'
import { useAuthStore } from '@/features/auth/auth-store'
import { fetchAppTerms } from '@/features/auth/lib/app-terms'
import { bootstrapAccountRegion, getAccountRegion } from '@/shared/api/account-region-store'

type SplashNav = NativeStackNavigationProp<RootStackParamList, 'Splash'>

export function SplashPage() {
  const navigation = useNavigation<SplashNav>()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const guestMode = useAuthStore((s) => s.guestMode)
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession)

  const placeholders = createAuthLoginShellPlaceholders()

  useEffect(() => {
    if (isRestoringSession) return

    let alive = true

    void (async () => {
      try {
        await bootstrapAccountRegion()
        await fetchAppTerms(getAccountRegion())
      } catch (err) {
        console.error('[SplashPage] bootstrap failed:', err)
      }

      if (!alive) return

      if (isLoggedIn || guestMode) {
        navigation.replace('Home')
      } else {
        navigation.replace('Login')
      }
    })()

    return () => {
      alive = false
    }
  }, [navigation, isLoggedIn, guestMode, isRestoringSession])

  return (
    <AuthLoginShell
      header={placeholders.header}
      footer={placeholders.footer}
    />
  )
}
