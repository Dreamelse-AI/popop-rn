import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { useLogin } from '@/features/auth/hooks/use-login'
import { AuthBottomSheet } from './auth-bottom-sheet'

import IconValidCircle from '@/shared/assets/auth/valid-circle.svg'
import IconCheck from '@/shared/assets/auth/check.svg'

type EmailModalProps = {
  loginHook: ReturnType<typeof useLogin>
}

function EmailValidIcon() {
  return (
    <View style={styles.validIcon}>
      <IconValidCircle width={24} height={24} />
      <View style={styles.validCheckOverlay}>
        <IconCheck width={20} height={20} />
      </View>
    </View>
  )
}

export function EmailModal({ loginHook }: EmailModalProps) {
  const {
    state,
    countdown,
    setEmail,
    setCode,
    sendCode,
    verifyAndLogin,
    closeEmailModal,
    handleEmailModalClosed,
    isValidEmail,
  } = loginHook
  const { t } = useTranslation()

  const email = state.email.trim()
  const emailValid = isValidEmail(email)
  const canSendCode = emailValid && !state.loading && !countdown.isActive
  const canLogin = emailValid && state.code.length === 6 && !state.loading

  return (
    <AuthBottomSheet
      open={state.showEmailModal}
      onClose={closeEmailModal}
      onClosed={handleEmailModalClosed}
      logoPeek
      fullHeight
      showLogo={false}
      sheetBackgroundColor="#ffffff"
      footerStyle={styles.footer}
      footer={
        <Pressable
          onPress={verifyAndLogin}
          disabled={!canLogin}
          style={[styles.submitButton, !canLogin && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitText}>
            {state.loading && state.step === 'code' ? t('email.signingIn') : t('email.signIn')}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('email.title')}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.fieldsSection}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('email.accountLabel')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={state.email}
                onChangeText={setEmail}
                placeholder={t('email.placeholder')}
                placeholderTextColor="rgba(0,0,0,0.2)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                style={[styles.input, emailValid && styles.inputValid]}
              />
              {emailValid && <EmailValidIcon />}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('email.verificationLabel')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={state.code}
                onChangeText={setCode}
                placeholder={t('email.codePlaceholder')}
                placeholderTextColor="rgba(0,0,0,0.2)"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
              <Pressable
                onPress={sendCode}
                disabled={!canSendCode}
                style={[styles.sendCodeButton, !canSendCode && styles.sendCodeButtonDisabled]}
              >
                <Text style={styles.sendCodeText}>
                  {state.sendingCode
                    ? t('email.sending')
                    : countdown.isActive
                      ? `${countdown.remaining}s`
                      : state.step === 'code'
                        ? t('email.resend')
                        : t('email.sendCode')}
                </Text>
              </Pressable>
            </View>
          </View>

          {state.error && (
            <Text style={styles.errorText}>{state.error}</Text>
          )}
        </View>
      </View>
    </AuthBottomSheet>
  )
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  titleSection: {
    gap: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  fieldsSection: {
    marginTop: 24,
    gap: 24,
  },
  fieldGroup: {
    gap: 12,
  },
  label: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 60,
    borderRadius: 24,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.9)',
    padding: 0,
  },
  inputValid: {
    color: '#000000',
  },
  validIcon: {
    flexShrink: 0,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  validCheckOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCodeButton: {
    flexShrink: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendCodeButtonDisabled: {
    opacity: 0.2,
  },
  sendCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  errorText: {
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#ef4444',
  },
  submitButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#c8c8c8',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
