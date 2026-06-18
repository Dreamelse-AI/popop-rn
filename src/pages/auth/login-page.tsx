import { useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'

import { useLogin } from '@/features/auth/hooks/use-login'
import { AgreeCheckbox } from '@/features/auth/components/agree-checkbox'
import { AgreeModal } from '@/features/auth/components/agree-modal'
import { EmailModal } from '@/features/auth/components/email-modal'
import { ProfileSetupModal } from '@/features/auth/components/profile-setup-modal'
import { ProviderButton } from '@/features/auth/components/provider-button'
import { LanguageSelector } from '@/features/auth/components/language-selector'
import { AuthLoginShell } from '@/pages/auth/auth-login-shell'
import type { AuthProvider } from '@/features/auth/auth-types'

export function LoginPage() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Login'>>()
  const loginHook = useLogin(navigation)

  const {
    state,
    termsList,
    handleEmailLogin,
    loginWithProvider,
    setAgreed,
    clearToast,
    handleSkipLogin,
  } = loginHook

  useEffect(() => {
    if (!state.toast) return
    const timer = setTimeout(clearToast, 2200)
    return () => clearTimeout(timer)
  }, [state.toast, clearToast])

  const handleProviderClick = (provider: AuthProvider) => {
    if (provider === 'email') {
      handleEmailLogin()
      return
    }
    loginWithProvider(provider)
  }

  return (
    <>
      <AuthLoginShell
        header={
          <>
            <LanguageSelector />

            <Pressable style={styles.skipButton} onPress={handleSkipLogin}>
              <Text style={styles.skipText}>{t('login.skip')}</Text>
            </Pressable>
          </>
        }
        footer={
          <>
            {state.error && !state.showEmailModal && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{state.error}</Text>
              </View>
            )}

            <View style={[styles.buttonGroup, state.providers.length >= 4 && styles.buttonGroupCompact]}>
              {state.providers.map(provider => (
                <ProviderButton
                  key={provider}
                  provider={provider}
                  loading={state.loading && provider !== 'email'}
                  compact={state.providers.length >= 4}
                  onClick={() => handleProviderClick(provider)}
                />
              ))}
            </View>

            <View style={styles.agreeRow}>
              <AgreeCheckbox checked={state.agreed} termsList={termsList} tone="light" onChange={setAgreed} />
            </View>
          </>
        }
        overlay={
          state.toast ? (
            <View style={[styles.toast, { top: Math.max(48, insets.top + 24) }]}>
              <Text style={styles.toastText}>{state.toast}</Text>
            </View>
          ) : null
        }
      />

      <EmailModal loginHook={loginHook} />
      <AgreeModal loginHook={loginHook} />
      <ProfileSetupModal loginHook={loginHook} />
    </>
  )
}

const styles = StyleSheet.create({
  skipButton: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  errorBanner: {
    marginBottom: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 12,
    paddingVertical: 12,
  },
  buttonGroupCompact: {
    gap: 8,
  },
  agreeRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 70,
  },
  toastText: {
    fontSize: 12,
    color: '#ffffff',
  },
})
