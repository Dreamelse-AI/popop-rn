import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, ActivityIndicator, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'

import { FullscreenPage, PageHeaderBar, BackButton } from '@/shared/ui/fullscreen-page'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { SheetBody, SheetHeader } from '@/shared/ui/sheet-primitives'
import { CenterDialog } from '@/shared/ui/center-dialog'

async function copyToClipboard(text: string) {
  try {
    const Clipboard = require('expo-clipboard')
    await Clipboard.setStringAsync(text)
  } catch {
    // fallback: silent fail
  }
}

type InviteRecord = {
  id: string
  name: string
  avatar: string
  date: string
  reward: number
}

const MOCK_RECORDS: InviteRecord[] = [
  { id: '1', name: '爱吃火鸡面的人', avatar: '', date: '2025/04/01 12:36', reward: 88 },
  { id: '2', name: '小火', avatar: '', date: '2025/04/01 12:36', reward: 88 },
  { id: '3', name: '沈星移的死忠粉', avatar: '', date: '2025/04/01 12:36', reward: 88 },
]

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

  const inviteCode = 'BE6A6B6C'

  const handleCopy = async () => {
    await copyToClipboard(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleCodeSubmit = () => {
    if (!codeInput.trim()) return
    setCodeLoading(true)
    setTimeout(() => {
      setCodeLoading(false)
      const code = codeInput.trim().toUpperCase()
      if (code === 'LIMIT') {
        showToast('您的好友今日邀请人数达上限，请明日再输入')
      } else if (code === 'ERROR') {
        showToast('请输入正确的邀请码')
      } else {
        setCodeSuccess(true)
      }
    }, 1500)
  }

  return (
    <FullscreenPage>
      <PageHeaderBar>
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
            onCopy={handleCopy}
            onShowRecords={() => setShowRecords(true)}
          />
        ) : (
          <CodeTab
            codeInput={codeInput}
            codeLoading={codeLoading}
            onChangeCode={setCodeInput}
            onSubmit={handleCodeSubmit}
          />
        )}
      </ScrollView>

      {/* Records bottom sheet */}
      <BottomSheet
        open={showRecords}
        onClose={() => setShowRecords(false)}
        header={<SheetHeader title="累计获得" />}
      >
        <SheetBody>
          <View style={styles.recordsSummary}>
            <View style={styles.recordsSummaryLeft}>
              <Text style={styles.recordsIceEmoji}>🧊</Text>
              <Text style={styles.recordsTotal}>264</Text>
            </View>
            <View style={styles.recordsBadge}>
              <Text style={styles.recordsBadgeText}>3天内邀请了3人</Text>
            </View>
          </View>
          <View style={styles.recordsList}>
          {MOCK_RECORDS.map(record => (
            <View key={record.id} style={styles.recordItem}>
              <View style={styles.recordLeft}>
                <View style={styles.recordAvatar} />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordName}>{record.name}</Text>
                  <Text style={styles.recordDate}>{record.date}</Text>
                </View>
              </View>
              <Text style={styles.recordReward}>+{record.reward}</Text>
            </View>
          ))}
        </View>
        </SheetBody>
      </BottomSheet>

      {/* Loading overlay */}
      {codeLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        </View>
      )}

      {/* Toast */}
      {toast && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Success dialog */}
      <CenterDialog
        open={codeSuccess}
        onClose={() => { setCodeSuccess(false); setCodeInput('') }}
        closeOnBackdrop={false}
      >
        <View style={styles.successContent}>
          <View style={styles.successInner}>
            <Text style={styles.successEmoji}>🧊</Text>
            <Text style={styles.successAmount}>88</Text>
            <Text style={styles.successTitle}>🎉 恭喜完成注册，</Text>
            <Text style={styles.successSubtitle}>你的 88 星星币已到账</Text>
          </View>
          <View style={styles.successButtonWrapper}>
            <Pressable
              style={styles.successButton}
              onPress={() => { setCodeSuccess(false); setCodeInput('') }}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </CenterDialog>
    </FullscreenPage>
  )
}

function InviteTab({ copied, inviteCode, onCopy, onShowRecords }: {
  copied: boolean
  inviteCode: string
  onCopy: () => void
  onShowRecords: () => void
}) {
  return (
    <View style={styles.inviteContainer}>
      {/* Main invite card */}
      <View style={styles.inviteCard}>
        <View style={styles.inviteHeadline}>
          <Text style={styles.inviteHeadlineText}>邀好友赢</Text>
          <Text style={styles.inviteHeadlineNumber}>88</Text>
          <Text style={styles.inviteHeadlineEmoji}>🧊</Text>
        </View>
        <Text style={styles.inviteDesc}>每日可邀请n个新用户下载并完成注册，得积分</Text>

        <View style={styles.statsRow}>
          <Pressable style={styles.statCard} onPress={onShowRecords}>
            <Text style={styles.statLabel}>累计获得</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>264</Text>
              <Text style={styles.statChevron}>›</Text>
            </View>
          </Pressable>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>今日邀请人数</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statValueGray}>/3</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.copyButton} onPress={onCopy}>
          <Text style={styles.copyButtonText}>
            {copied ? '✅ 复制成功！' : '📋 复制邀请码'}
          </Text>
          <Text style={styles.copyButtonSub}>（我的邀请码：{inviteCode}）</Text>
        </Pressable>
      </View>

      {/* Steps card */}
      <View style={styles.stepsCard}>
        <View style={styles.stepsDividerRow}>
          <View style={styles.stepsDivider} />
          <Text style={styles.stepsTitle}>仅需3步即可获得星星币</Text>
          <View style={styles.stepsDivider} />
        </View>
        <View style={styles.stepsContent}>
          <StepItem emoji="🔗" title="Step1. 分享专属邀请链接/邀请码" desc="点击按钮，把链接/邀请码发给好友" />
          <View style={styles.stepSeparator} />
          <StepItem emoji="✨" title="Step2. 好友下载演我App" desc="好友通过邀请链接/邀请码，下载演我" />
          <View style={styles.stepSeparator} />
          <StepItem emoji="🎉" title="Step3. 好友完成新账号注册" desc="好友注册账号并登录演我，完成邀请" />
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

function CodeTab({ codeInput, codeLoading, onChangeCode, onSubmit }: {
  codeInput: string
  codeLoading: boolean
  onChangeCode: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <View style={styles.codeContainer}>
      <View style={styles.codeCard}>
        <Text style={styles.codeTitle}>邀请码</Text>
        <View style={styles.codeInputWrapper}>
          <TextInput
            value={codeInput}
            onChangeText={v => onChangeCode(v.toUpperCase())}
            placeholder="输入邀请码"
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
          <Text style={styles.codeSubmitText}>确认</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // Tabs
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

  // Scroll
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Invite tab
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

  // Steps
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

  // Code tab
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

  // Records bottom sheet
  recordsHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
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
  recordsList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 76,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
  },
  recordInfo: {
    gap: 4,
  },
  recordName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  recordDate: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  recordReward: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },

  // Loading overlay
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

  // Toast
  toastContainer: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    zIndex: 80,
    maxWidth: 320,
    transform: [{ translateX: -160 }],
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

  // Success dialog
  successContent: {
    alignItems: 'center',
  },
  successInner: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
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
