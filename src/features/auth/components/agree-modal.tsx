import { View, Text, Pressable, StyleSheet, Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { AgreementKey } from '../auth-types'
import {
  AGREEMENT_LINKS,
  getAgreementsByRegion,
  hasMarketingConsent,
} from '../region-config'
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
  onToggle: () => void
}

function AgreementRow({ checked, label, href, onToggle }: AgreementRowProps) {
  return (
    <View style={styles.rowContainer}>
      <Pressable onPress={onToggle} style={styles.rowContent}>
        <AgreementCheckIcon checked={checked} />
        <Text style={styles.rowLabel}>{label}</Text>
      </Pressable>
      {href && (
        <Pressable
          onPress={() => Linking.openURL(href)}
          style={styles.rowChevron}
          accessibilityLabel={`View ${label}`}
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
    toggleAgreement,
    toggleMarketingConsent,
    closeAgreeModal,
    submitAgreeAndLogin,
    canSubmitAgreements,
  } = loginHook
  const { t } = useTranslation()

  const agreements = getAgreementsByRegion(state.region)
  const showMarketing = hasMarketingConsent(state.region)
  const title = t('agreement.title')
  const confirmText = state.agreeModalMode === 'email' ? t('agreement.confirm') : t('agreement.continue')

  const renderRow = (key: AgreementKey) => {
    const label = t(`agreement.${key}`)
    const href = AGREEMENT_LINKS[key]

    return (
      <AgreementRow
        key={key}
        checked={!!state.agreementChecks[key]}
        label={label}
        href={href}
        onToggle={() => toggleAgreement(key)}
      />
    )
  }

  return (
    <AuthBottomSheet
      open={state.showAgreeModal}
      onClose={closeAgreeModal}
      footer={
        <Pressable
          onPress={submitAgreeAndLogin}
          disabled={!canSubmitAgreements || state.loading}
          style={[styles.submitButton, (!canSubmitAgreements || state.loading) && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitText}>
            {state.loading ? t('email.signingIn') : confirmText}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.rowsSection}>
          {agreements.map(renderRow)}
          {showMarketing && (
            <AgreementRow
              checked={state.marketingConsent}
              label={t('agreement.marketingConsent')}
              href="/marketing-consent"
              onToggle={toggleMarketingConsent}
            />
          )}
        </View>
      </View>
    </AuthBottomSheet>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 16,
  },
  titleSection: {
    gap: 12,
    paddingHorizontal: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rowsSection: {
    gap: 8,
    paddingHorizontal: 12,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  rowChevron: {
    flexShrink: 0,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconWrapper: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconUnchecked: {
    opacity: 0.1,
  },
  checkIconCircle: {
    width: 24,
    height: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconCheckOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.2,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
