import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useWalletStore } from './wallet-store'

type WalletBalanceCardProps = {
  onRecharge: () => void
  onOpenHistory?: () => void
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

export function WalletBalanceCard({ onRecharge, onOpenHistory, compact = false }: WalletBalanceCardProps) {
  const { t } = useTranslation()
  const paidTokens = useWalletStore(s => s.paidTokens)
  const totalTokens = useWalletStore(s => s.totalTokens)
  const grantProgress = useWalletGrantProgress()

  const paidBalance = paidTokens ?? totalTokens ?? 0
  const showGrantCountdown = grantProgress.canGrantMore && grantProgress.countdown

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.balanceRow}>
        <View style={styles.balanceLeft}>
          <Text style={styles.iceEmoji}>🧊</Text>
          <Text style={styles.paidBalance}>{paidBalance}</Text>
          <View style={styles.giftBadge}>
            <Text style={styles.giftBadgeText}>+ {grantProgress.giftBalance} 🧊</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.rechargeButton} onPress={onRecharge}>
            <Text style={styles.rechargeText}>{t('me.recharge')}</Text>
          </Pressable>
          {onOpenHistory ? (
            <Pressable style={styles.detailButton} onPress={onOpenHistory}>
              <Text style={styles.detailText}>{t('me.detail')}</Text>
            </Pressable>
          ) : null}
        </View>
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
    borderRadius: 999,
    backgroundColor: '#f0f2f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  giftBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rechargeButton: {
    height: 36,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
  },
  rechargeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailButton: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#f0f2f4',
    paddingHorizontal: 12,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
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
})
