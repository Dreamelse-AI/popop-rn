import { View, Text, Pressable, StyleSheet, Linking } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import type { TermsInfo } from '@/generated/arca_apiComponents'
import type { useLogin } from '../hooks/use-login'
import { AuthBottomSheet } from './auth-bottom-sheet'
import { PopImage } from '@/shared/ui/pop-image'
import { cdnImage } from '@/shared/lib/cdn'
const IconChevronRight = cdnImage('assets/auth/chevron-right.png')

type AgreeModalProps = {
  loginHook: ReturnType<typeof useLogin>
}

function AgreementCheckIcon({ checked }: { checked: boolean }) {
  if (!checked) {
    return (
      <View style={styles.checkIconWrapper}>
        <View style={styles.checkIconUnchecked} />
      </View>
    )
  }

  return (
    <View style={styles.checkIconWrapper}>
      <View style={styles.checkIconChecked}>
        <Svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
          <Path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </Svg>
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
  const hasChevron = !!href || showChevron

  return (
    <Pressable onPress={onToggle} style={styles.rowContainer}>
      <AgreementCheckIcon checked={checked} />
      <Text style={styles.rowLabel}>{label}</Text>
      {hasChevron && (
        href ? (
          <Pressable
            onPress={() => Linking.openURL(href)}
            style={styles.rowChevron}
            accessibilityLabel={`View ${label}`}
          >
            <PopImage uri={IconChevronRight} style={{width: 24, height: 24}} />
          </Pressable>
        ) : (
          <View style={styles.rowChevron} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <PopImage uri={IconChevronRight} style={{width: 24, height: 24}} />
          </View>
        )
      )}
    </Pressable>
  )
}

export function AgreeModal({ loginHook }: AgreeModalProps) {
  const {
    state,
    termsList,
    toggleAgreement,
    closeAgreeModal,
    handleAgreeModalClosed,
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
      onClosed={handleAgreeModalClosed}
      logoPeek
      fullHeight
      showLogo={false}
      sheetBackgroundColor="#ffffff"
      footerStyle={styles.footer}
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
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.rows}>{termsList.map(renderRow)}</View>
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
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
    textAlign: 'center',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rows: {
    marginTop: 24,
    gap: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 60,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#000000',
  },
  rowChevron: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconWrapper: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  checkIconChecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
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
    backgroundColor: '#c8c8c8',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
