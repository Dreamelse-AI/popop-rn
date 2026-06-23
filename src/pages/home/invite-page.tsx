import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'

import { inviteInfo, inviteRedeem } from '@/generated/arca_api'
import type { InviteInfoResp } from '@/generated/arca_apiComponents'
import { refreshWallet } from '@/shared/wallet'
import { FullscreenPage, PageHeaderBar, BackButton } from '@/shared/ui/fullscreen-page'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { SheetBody, SheetHeader } from '@/shared/ui/sheet-primitives'
import { CenterDialog } from '@/shared/ui/center-dialog'

const INVITE_REWARD_TOKENS = 88
const INVITE_LIMIT_PER_DAY = 3

async function copyToClipboard(text: string) {
  try {
    const Clipboard = require('expo-clipboard')
    await Clipboard.setStringAsync(text)
  } catch {
    // silent fail
  }
}

type InvitePageProps = {
  onBack: () => void
}

export function InvitePage({ onBack }: InvitePageProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'invite' | 'code'>('invite')
  const [showRecords, setShowRecords] = useState(false)
  const [copied, setCopied] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeSuccess, setCodeSuccess] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [info, setInfo] = useState<InviteInfoResp | null>(null)
  const [infoLoading, setInfoLoading] = useState(true)
  const [infoError, setInfoError] = useState<string | null>(null)
  const [successReward, setSuccessReward] = useState(INVITE_REWARD_TOKENS)

  const inviteCode = info?.invite_code ?? ''
  const invitedCount = info?.invited_count ?? 0
  const totalRewardTokens = info?.total_reward_tokens ?? 0
  const todayInviteCount = Math.min(invitedCount, INVITE_LIMIT_PER_DAY)

  const loadInviteInfo = useCallback(async () => {
    setInfoLoading(true)
    setInfoError(null)
    try {
      const resp = await inviteInfo()
      setInfo(resp)
    } catch (err) {
      setInfoError(err instanceof Error ? err.message : t('character.detailPage.loadFailed'))
    } finally {
      setInfoLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadInviteInfo()
  }, [loadInviteInfo])

  const handleCopy = async () => {
    if (!inviteCode) return
    await copyToClipboard(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleCodeSubmit = async () => {
    if (!codeInput.trim()) return
    setCodeLoading(true)
    try {
      const resp = await inviteRedeem({ invite_code: codeInput.trim().toUpperCase() })
      if (resp.success) {
        setSuccessReward(resp.reward_tokens)
        setCodeSuccess(true)
        void refreshWallet()
        void loadInviteInfo()
      } else {
        showToast(resp.message || t('invite.invalidCodeToast'))
      }
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : t('invite.invalidCodeToast'))
    } finally {
      setCodeLoading(false)
    }
  }

  return (
    <FullscreenPage>
      <PageHeaderBar includeSafeAreaTop={false}>
        <BackButton onPress={onBack} />
        <View style={styles.tabRow}>
          <Pressable style={styles.tabButton} onPress={() => setTab('invite')}>
            <Text style={[styles.tabLabel, tab !== 'invite' && styles.tabLabelInactive]}>
              {t('invite.invite')}
            </Text>
            {tab === 'invite' && <View style={styles.tabIndicator} />}
          </Pressable>
          <Pressable style={styles.tabButton} onPress={() => setTab('code')}>
            <Text style={[styles.tabLabel, tab !== 'code' && styles.tabLabelInactive]}>
              {t('invite.inviteCode')}
            </Text>
            {tab === 'code' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>
      </PageHeaderBar>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {tab === 'invite' ? (
          <InviteTab
            copied={copied}
            inviteCode={inviteCode}
            infoLoading={infoLoading}
            infoError={infoError}
            invitedCount={todayInviteCount}
            totalRewardTokens={totalRewardTokens}
            onCopy={() => void handleCopy()}
            onRetry={() => void loadInviteInfo()}
            onShowRecords={() => setShowRecords(true)}
          />
        ) : (
          <CodeTab
            codeInput={codeInput}
            codeLoading={codeLoading}
            onChangeCode={setCodeInput}
            onSubmit={() => void handleCodeSubmit()}
          />
        )}
      </ScrollView>

      <BottomSheet
        open={showRecords}
        onClose={() => setShowRecords(false)}
        header={<SheetHeader title={t('invite.totalEarned')} />}
      >
        <SheetBody>
          <View style={styles.recordsSummary}>
            <View style={styles.recordsSummaryLeft}>
              <Text style={styles.recordsIceEmoji}>🧊</Text>
              <Text style={styles.recordsTotal}>{totalRewardTokens}</Text>
            </View>
            <View style={styles.recordsBadge}>
              <Text style={styles.recordsBadgeText}>
                {t('invite.invitedInDays', { days: 3, count: invitedCount })}
              </Text>
            </View>
          </View>
          <View style={styles.recordsEmpty}>
            <Text style={styles.recordsEmptyText}>{t('history.empty')}</Text>
          </View>
        </SheetBody>
      </BottomSheet>

      {codeLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        </View>
      )}

      {toast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastInner}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}

      <CenterDialog
        open={codeSuccess}
        onClose={() => {
          setCodeSuccess(false)
          setCodeInput('')
        }}
        closeOnBackdrop={false}
      >
        <LinearGradient
          colors={['#d7f0ff', '#d7f0ff', '#ffffff']}
          locations={[0.02, 0.16, 0.38]}
          style={styles.successContent}
        >
          <View style={styles.successInner}>
            <Text style={styles.successEmoji}>🧊</Text>
            <Text style={styles.successAmount}>{successReward}</Text>
            <Text style={styles.successTitle}>{t('invite.codeSuccessTitle')}</Text>
            <Text style={styles.successSubtitle}>
              {t('invite.codeSuccessMessage', { amount: successReward })}
            </Text>
          </View>
          <View style={styles.successButtonWrapper}>
            <Pressable
              style={styles.successButton}
              onPress={() => {
                setCodeSuccess(false)
                setCodeInput('')
              }}
            >
              <Text style={styles.successButtonText}>{t('me.confirm')}</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </CenterDialog>
    </FullscreenPage>
  )
}

function InviteTab({
  copied,
  inviteCode,
  infoLoading,
  infoError,
  invitedCount,
  totalRewardTokens,
  onCopy,
  onRetry,
  onShowRecords,
}: {
  copied: boolean
  inviteCode: string
  infoLoading: boolean
  infoError: string | null
  invitedCount: number
  totalRewardTokens: number
  onCopy: () => void
  onRetry: () => void
  onShowRecords: () => void
}) {
  const { t } = useTranslation()

  return (
    <View style={styles.inviteContainer}>
      <View style={styles.inviteCard}>
        <View style={styles.inviteHeadline}>
          <Text style={styles.inviteHeadlineText}>{t('invite.inviteFriendsWin')}</Text>
          <Text style={styles.inviteHeadlineNumber}>{INVITE_REWARD_TOKENS}</Text>
          <Text style={styles.inviteHeadlineEmoji}>🧊</Text>
        </View>
        <Text style={styles.inviteDesc}>{t('invite.inviteHint')}</Text>

        {infoError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{infoError}</Text>
            <Pressable onPress={onRetry}>
              <Text style={styles.errorBannerRetry}>{t('history.retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <Pressable style={styles.statCard} onPress={onShowRecords}>
            <Text style={styles.statLabel}>{t('invite.totalEarned')}</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{infoLoading ? '...' : totalRewardTokens}</Text>
              <Text style={styles.statChevron}>›</Text>
            </View>
          </Pressable>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('invite.todayInvites')}</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{infoLoading ? '...' : invitedCount}</Text>
              <Text style={styles.statValueGray}>/{INVITE_LIMIT_PER_DAY}</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.copyButton, !inviteCode && styles.disabledButton]}
          onPress={onCopy}
          disabled={!inviteCode}
        >
          <Text style={styles.copyButtonText}>
            {copied ? t('invite.copySuccess') : t('invite.copyInviteCode')}
          </Text>
          <Text style={styles.copyButtonSub}>
            {t('invite.myInviteCode', { code: inviteCode })}
          </Text>
        </Pressable>
      </View>

      <View style={styles.stepsCard}>
        <View style={styles.stepsDividerRow}>
          <View style={styles.stepsDivider} />
          <Text style={styles.stepsTitle}>{t('invite.stepsTitle')}</Text>
          <View style={styles.stepsDivider} />
        </View>
        <View style={styles.stepsContent}>
          <StepItem emoji="🔗" title={t('invite.step1Title')} desc={t('invite.step1Desc')} />
          <View style={styles.stepSeparator} />
          <StepItem emoji="✨" title={t('invite.step2Title')} desc={t('invite.step2Desc')} />
          <View style={styles.stepSeparator} />
          <StepItem emoji="🎉" title={t('invite.step3Title')} desc={t('invite.step3Desc')} />
        </View>
      </View>
    </View>
  )
}

function StepItem({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepIcon}>
        <Text style={styles.stepEmoji}>{emoji}</Text>
      </View>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  )
}

function CodeTab({
  codeInput,
  codeLoading,
  onChangeCode,
  onSubmit,
}: {
  codeInput: string
  codeLoading: boolean
  onChangeCode: (v: string) => void
  onSubmit: () => void
}) {
  const { t } = useTranslation()

  return (
    <View style={styles.codeContainer}>
      <View style={styles.codeCard}>
        <Text style={styles.codeTitle}>{t('invite.inviteCode')}</Text>
        <View style={styles.codeInputWrapper}>
          <TextInput
            value={codeInput}
            onChangeText={v => onChangeCode(v.toUpperCase())}
            placeholder={t('invite.codePlaceholder')}
            placeholderTextColor="#b5b6b3"
            style={styles.codeInput}
            maxLength={8}
            autoCapitalize="characters"
          />
        </View>
        <Pressable
          style={[styles.codeSubmitButton, (!codeInput.trim() || codeLoading) && styles.disabledButton]}
          onPress={onSubmit}
          disabled={!codeInput.trim() || codeLoading}
        >
          <Text style={styles.codeSubmitText}>{t('me.confirm')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tabButton: {
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  tabLabelInactive: {
    opacity: 0.4,
  },
  tabIndicator: {
    height: 3,
    width: '100%',
    borderRadius: 1.5,
    backgroundColor: '#000000',
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  inviteContainer: {
    gap: 8,
  },
  inviteCard: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  inviteHeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  inviteHeadlineText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  inviteHeadlineNumber: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
  },
  inviteHeadlineEmoji: {
    fontSize: 40,
  },
  inviteDesc: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
  errorBannerRetry: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b91c1c',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  statCard: {
    flex: 1,
    height: 89,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 20,
    padding: 16,
    gap: 4,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  statValueGray: {
    fontSize: 20,
    color: 'rgba(0,0,0,0.6)',
  },
  statChevron: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.3)',
  },
  copyButton: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fdeab3',
    borderRadius: 20,
    paddingVertical: 12,
  },
  copyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  copyButtonSub: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
  },
  stepsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 24,
  },
  stepsDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepsDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  stepsContent: {
    gap: 16,
  },
  stepSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fdeab3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepEmoji: {
    fontSize: 18,
  },
  stepText: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  stepDesc: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
  },
  codeContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 80,
  },
  codeCard: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  codeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  codeInputWrapper: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 20,
    padding: 16,
  },
  codeInput: {
    width: '100%',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 32,
    color: '#000000',
  },
  codeSubmitButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#fdeab3',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeSubmitText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  recordsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordsSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordsIceEmoji: {
    fontSize: 40,
  },
  recordsTotal: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
  },
  recordsBadge: {
    backgroundColor: '#fdeab3',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  recordsBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  recordsEmpty: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  recordsEmptyText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: 'rgba(40,42,45,0.9)',
    borderRadius: 16,
    padding: 24,
  },
  toastContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    zIndex: 80,
    alignItems: 'center',
  },
  toastInner: {
    maxWidth: 320,
    backgroundColor: 'rgba(26,26,26,0.9)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
  successContent: {
    alignItems: 'center',
    borderRadius: 30,
    overflow: 'hidden',
  },
  successInner: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  successEmoji: {
    fontSize: 60,
  },
  successAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  successButtonWrapper: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  successButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#000000',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
