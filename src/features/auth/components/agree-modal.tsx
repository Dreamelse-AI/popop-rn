import { View, Text, Pressable, StyleSheet, Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { TermsInfo } from '@/generated/arca_apiComponents'
import type { useLogin } from '../hooks/use-login'
import { AuthBottomSheet } from './auth-bottom-sheet'
import IconValidCircle from '@/shared/assets/auth/valid-circle.svg'
import IconCheck from '@/shared/assets/auth/check.svg'
import IconChevronRight from '@/shared/assets/auth/chevron-right.svg'

type AgreeModalProps = {
  loginHook: ReturnType<typeof useLogin>
}

function AgreementCheckIcon({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkIconWrapper, !checked && styles.checkIconUnchecked]}>
      <View style={styles.checkIconCircle}>
        <IconValidCircle width={24} height={24} />
        <View style={styles.checkIconCheckOverlay}>
          <IconCheck width={20} height={20} />
        </View>
      </View>
    </View>
  )
}

type AgreementRowProps = {
  checked: boolean
  label: string
  href?: string
  showChevron?: boolean
  onToggle: () => void
}

function AgreementRow({ checked, label, href, showChevron = false, onToggle }: AgreementRowProps) {
  return (
    <View style={styles.rowContainer}>
      <Pressable onPress={onToggle} style={styles.rowContent}>
        <AgreementCheckIcon checked={checked} />
        <Text style={styles.rowLabel}>{label}</Text>
      </Pressable>
      {(href || showChevron) && (
        <Pressable
          onPress={href ? () => Linking.openURL(href) : undefined}
          style={styles.rowChevron}
          accessibilityLabel={href ? `View ${label}` : undefined}
          disabled={!href}
        >
          <IconChevronRight width={24} height={24} />
        </Pressable>
      )}
    </View>
  )
}

export function AgreeModal({ loginHook }: AgreeModalProps) {
  const {
    state,
    termsList,
    toggleAgreement,
    closeAgreeModal,
    submitAgreeAndLogin,
    canSubmitAgreements,
  } = loginHook
  const { t } = useTranslation()

  const title = t('agreement.title')
  const confirmText = state.agreeModalMode === 'email' ? t('agreement.confirm') : t('agreement.continue')
  const canSubmit = canSubmitAgreements && !state.loading

  const renderRow = (term: TermsInfo) => (
    <AgreementRow
      key={term.terms_id}
      checked={!!state.agreementChecks[term.terms_id]}
      label={term.title}
      href={term.link || undefined}
      showChevron={!term.link}
      onToggle={() => toggleAgreement(term.terms_id)}
    />
  )

  return (
    <AuthBottomSheet
      open={state.showAgreeModal}
      onClose={closeAgreeModal}
      showLogo={false}
      footer={
        <Pressable
          onPress={submitAgreeAndLogin}
          disabled={!canSubmit}
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitButtonText}>
            {state.loading ? t('email.signingIn') : confirmText}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.divider} />
        <View style={styles.rows}>{termsList.map(renderRow)}</View>
      </View>
    </AuthBottomSheet>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 24,
  },
  rows: {
    gap: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  rowChevron: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconUnchecked: {
    opacity: 0.35,
  },
  checkIconCircle: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  checkIconCheckOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#c8c8c8',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
})
