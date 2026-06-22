import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useWalletStore } from './wallet-store'

type WalletBalanceCardProps = {
  onRecharge: () => void
  compact?: boolean
}

type WalletGrantProgress = {
  giftBalance: number
  cap: number
  progressPercent: number
  canGrantMore: boolean
  nextGrantAmount: number
  countdown: string | null
  progressFilled: boolean
}

function formatCountdown(remainSec: number): string {
  const h = Math.floor(remainSec / 3600)
  const m = Math.floor((remainSec % 3600) / 60)
  const s = remainSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function useGrantTimer() {
  const grantRemainSec = useWalletStore(s => s.grantRemainSec)
  const grantFetchedAt = useWalletStore(s => s.grantFetchedAt)
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    if (grantRemainSec == null) return
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [grantRemainSec])

  if (grantRemainSec == null || grantFetchedAt == null) return null

  const elapsed = nowSec - grantFetchedAt
  const remainSec = Math.max(0, grantRemainSec - elapsed)
  return {
    countdown: formatCountdown(remainSec),
  }
}

export function useWalletGrantProgress(): WalletGrantProgress {
  const freeTokens = useWalletStore(s => s.freeTokens)
  const nextGrantAmount = useWalletStore(s => s.nextGrantAmount)
  const grantCap = useWalletStore(s => s.grantCap)
  const timer = useGrantTimer()

  const giftBalance = freeTokens ?? 0
  const cap = grantCap ?? 0
  const progressValue = cap > 0 ? Math.min(giftBalance, cap) : 0
  const progressPercent = cap > 0 ? Math.min(100, Math.max(0, (progressValue / cap) * 100)) : 0
  const normalizedGrantAmount = nextGrantAmount ?? 0
  const canGrantMore = cap > 0 && progressValue < cap && normalizedGrantAmount > 0

  return {
    giftBalance,
    cap,
    progressPercent,
    canGrantMore,
    nextGrantAmount: normalizedGrantAmount,
    countdown: timer?.countdown ?? null,
    progressFilled: progressPercent >= 100,
  }
}

export function WalletBalanceCard({ onRecharge, compact = false }: WalletBalanceCardProps) {
  const { t } = useTranslation()
  const paidTokens = useWalletStore(s => s.paidTokens)
  const totalTokens = useWalletStore(s => s.totalTokens)
  const grantProgress = useWalletGrantProgress()

  const totalBalance = totalTokens ?? (paidTokens ?? 0) + (grantProgress.giftBalance ?? 0)
  const showGrantCountdown = grantProgress.canGrantMore && grantProgress.countdown

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={[styles.balanceRow, compact && styles.balanceRowCompact]}>
        <View style={styles.balanceLeft}>
          <Text style={[styles.iceEmoji, compact && styles.iceEmojiCompact]}>🧊</Text>
          <Text style={[styles.paidBalance, compact && styles.paidBalanceCompact]}>{totalBalance}</Text>
          <View style={[styles.giftBadge, compact && styles.giftBadgeCompact]}>
            <Text style={[styles.giftBadgeText, compact && styles.giftBadgeTextCompact]}>+ {grantProgress.giftBalance}</Text>
            <Text style={[styles.giftBadgeEmoji, compact && styles.giftBadgeEmojiCompact]}>🧊</Text>
          </View>
        </View>
        <Pressable style={[styles.rechargeButton, compact && styles.rechargeButtonCompact]} onPress={onRecharge}>
          <Text style={[styles.rechargeText, compact && styles.rechargeTextCompact]}>{t('me.recharge')}</Text>
        </Pressable>
      </View>

      {grantProgress.cap > 0 ? (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              grantProgress.progressFilled ? styles.progressFillFull : styles.progressFillPartial,
              { width: `${grantProgress.progressPercent}%` },
            ]}
          />
          <View style={styles.progressContent}>
            <Text style={styles.progressText}>
              {showGrantCountdown
                ? t('wallet.grantCountdown', {
                  time: grantProgress.countdown,
                  amount: grantProgress.nextGrantAmount,
                  defaultValue: `${grantProgress.countdown} +${grantProgress.nextGrantAmount}`,
                })
                : ''}
            </Text>
            <Text style={styles.progressText}>
              {grantProgress.giftBalance}
              <Text style={styles.progressMuted}>/{grantProgress.cap}</Text> 🧊
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
  },
  cardCompact: {
    marginHorizontal: 12,
    marginBottom: 10,
  },
  balanceRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  balanceLeft: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iceEmoji: {
    fontSize: 34,
  },
  paidBalance: {
    fontSize: 30,
    fontWeight: '900',
    color: '#000000',
  },
  giftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#f0f2f4',
    paddingHorizontal: 8,
    height: 23,
  },
  giftBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  giftBadgeEmoji: {
    fontSize: 10,
    lineHeight: 10,
  },
  rechargeButton: {
    height: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#000000',
  },
  rechargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressTrack: {
    position: 'relative',
    height: 34,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#eefaff',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ccefff',
  },
  progressFillPartial: {
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  progressFillFull: {
    borderBottomRightRadius: 20,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  progressMuted: {
    color: 'rgba(0,0,0,0.35)',
  },
  // compact variants (sidebar)
  balanceRowCompact: {
    minHeight: 52,
    paddingVertical: 6,
  },
  iceEmojiCompact: {
    fontSize: 22,
  },
  paidBalanceCompact: {
    fontSize: 20,
    fontWeight: '800',
  },
  giftBadgeCompact: {
    height: 18,
    paddingHorizontal: 6,
  },
  giftBadgeTextCompact: {
    fontSize: 10,
  },
  giftBadgeEmojiCompact: {
    fontSize: 8,
    lineHeight: 8,
  },
  rechargeTextCompact: {
    fontSize: 13,
    fontWeight: '600',
  },
  rechargeButtonCompact: {
    height: 28,
    paddingHorizontal: 12,
  },
})
