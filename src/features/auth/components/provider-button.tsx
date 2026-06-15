import { Pressable, Text, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'
import type { AuthProvider } from '../auth-types'
import { PROVIDER_LABELS } from '../region-config'

type ProviderButtonProps = {
  provider: AuthProvider
  loading?: boolean
  compact?: boolean
  onClick: () => void
}

const PROVIDER_COLORS: Record<AuthProvider, { bg: string; text: string }> = {
  apple: { bg: '#000000', text: '#ffffff' },
  google: { bg: '#ffffff', text: '#000000' },
  email: { bg: '#ffffff', text: '#000000' },
  line: { bg: '#06C755', text: '#ffffff' },
  kakao: { bg: '#FEE500', text: '#191919' },
}

function AppleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="white">
      <Path d="M16.365 1.43c0 1.14-.465 2.205-1.14 2.985-.735.84-1.965 1.485-2.985 1.395-.135-1.095.405-2.265 1.08-3.015.75-.84 2.04-1.44 3.045-1.365ZM20.7 17.49c-.555 1.275-.825 1.845-1.545 2.97-1.005 1.545-2.43 3.48-4.2 3.495-1.575.015-1.98-1.02-4.125-1.005-2.13.015-2.58 1.035-4.155 1.02-1.77-.015-3.12-1.755-4.14-3.3-2.835-4.335-3.135-9.42-1.38-12.12 1.245-1.905 3.21-3.03 5.055-3.03 1.875 0 3.06 1.035 4.605 1.035 1.5 0 2.415-1.035 4.575-1.035 1.635 0 3.36.885 4.605 2.415-4.05 2.22-3.39 8.01.705 9.555Z" />
    </Svg>
  )
}

function GoogleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <Path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z" />
    </Svg>
  )
}

function EmailIcon() {
  return (
    <Svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={1.8}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.24a2.25 2.25 0 0 1-1.07 1.92l-7.5 4.61a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.92v-.24" />
    </Svg>
  )
}

function LineIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="white">
      <Path d="M24 10.31C24 4.94 18.62.57 12 .57S0 4.94 0 10.31c0 4.81 4.27 8.84 10.04 9.61.39.08.92.26 1.06.59.12.3.08.77.04 1.08l-.17 1.02c-.05.3-.24 1.19 1.05.65 1.29-.54 6.92-4.08 9.44-6.98C23.18 14.39 24 12.46 24 10.31Z" />
    </Svg>
  )
}

function KakaoIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="#191919">
      <Path d="M12 3C6.48 3 2 6.46 2 10.69c0 2.72 1.8 5.11 4.52 6.47-.15.53-.94 3.41-.97 3.63 0 0-.02.17.09.23.11.06.24.02.24.02.31-.04 3.59-2.36 4.15-2.77.64.09 1.29.14 1.97.14 5.52 0 10-3.46 10-7.72C22 6.46 17.52 3 12 3Z" />
    </Svg>
  )
}

function ProviderIcon({ provider }: { provider: AuthProvider }) {
  switch (provider) {
    case 'apple': return <AppleIcon />
    case 'google': return <GoogleIcon />
    case 'email': return <EmailIcon />
    case 'line': return <LineIcon />
    case 'kakao': return <KakaoIcon />
  }
}

export function ProviderButton({
  provider,
  loading = false,
  compact = false,
  onClick,
}: ProviderButtonProps) {
  const { t } = useTranslation()
  const colors = PROVIDER_COLORS[provider]

  return (
    <Pressable
      onPress={onClick}
      disabled={loading}
      style={[
        styles.button,
        { backgroundColor: colors.bg, height: compact ? 52 : 60 },
        loading && styles.disabled,
      ]}
    >
      <ProviderIcon provider={provider} />
      <Text style={[styles.label, { color: colors.text }]}>
        {loading ? t('login.loading') : t('login.continueWith', { provider: PROVIDER_LABELS[provider] })}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
})
