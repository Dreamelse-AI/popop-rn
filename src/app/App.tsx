import { useCallback, useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { setAudioModeAsync } from 'expo-audio'
import { RootNavigator } from './navigation'
import { AppStripeProvider } from '@/shared/wallet/stripe-provider'
import { useAuthStore } from '@/features/auth/auth-store'
import { useAppState } from '@/shared/hooks/use-app-state'
import { apiClient } from '@/shared/api/api-client'
import { RechargeHost, GlobalToastHost, refreshWallet, useWalletStore } from '@/shared/wallet'

SplashScreen.preventAutoHideAsync()

function setupGlobalAudioMode() {
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
  })
}

export function App() {
  const [appReady, setAppReady] = useState(false)
  const restoreSession = useAuthStore((s) => s.restoreSession)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    apiClient.setToken(token)
    if (token) {
      void refreshWallet()
    } else {
      useWalletStore.getState().reset()
    }
  }, [token])

  useEffect(() => {
    async function prepare() {
      setupGlobalAudioMode()
      await restoreSession()
      setAppReady(true)
      await SplashScreen.hideAsync()
    }
    void prepare()
  }, [restoreSession])

  const handleForeground = useCallback(() => {
    void restoreSession()
  }, [restoreSession])

  useAppState({ onForeground: handleForeground })

  if (!appReady) return null

  return (
    <AppStripeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
        <RechargeHost />
        <GlobalToastHost />
      </SafeAreaProvider>
    </AppStripeProvider>
  )
}
