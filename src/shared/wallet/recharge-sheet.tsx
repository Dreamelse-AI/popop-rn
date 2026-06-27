import { useMemo } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native'
import { Trans, useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { RechargePackageItem } from '@/generated/arca_apiComponents'
import { useAppTerms } from '@/features/auth/hooks/use-app-terms'
import { getAccountRegion } from '@/shared/api/account-region-store'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { FullscreenPage, PageHeaderBar, BackButton } from '@/shared/ui/fullscreen-page'

import { getProviderProductId, getRechargeProvider } from './iap-utils'
import { useWalletStore } from './wallet-store'

type RechargeSheetProps = {
  open: boolean
  packages: RechargePackageItem[]
  packagesLoading: boolean
  packagesError: string | null
  selectedPackageId: string | null
  iapPriceLabels: Record<string, string>
  isPurchasing: boolean
  orderError: string | null
  onClose: () => void
  onSelectPackage: (packageId: string) => void
  onRetryPackages: () => void
  onContinue: () => void
  onOpenHistory?: () => void
  presentation?: 'sheet' | 'fullscreen'
}

function normalizeTermsType(type: string): string {
  return type.trim().toLowerCase().replace(/[-\s]+/g, '_')
}

function chunkPackages<T>(items: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size))
  }
  return rows
}

function formatPackageAmount(pkg: RechargePackageItem): string {
  if (pkg.bonus_tokens > 0) {
    return `${pkg.tokens}+${pkg.bonus_tokens}`
  }
  return String(pkg.tokens)
}

function getPackageDisplayPrice(
  pkg: RechargePackageItem,
  iapPriceLabels: Record<string, string>,
): string {
  const productId = getProviderProductId(pkg)
  if (productId && iapPriceLabels[productId]) {
    return iapPriceLabels[productId]
  }

  const displayPrice = pkg.provider_products?.[getRechargeProvider()]?.display_price?.trim()
  if (displayPrice) return displayPrice

  const dollarSuffix = pkg.name.match(/([\d.]+)\s*\$/)
  if (dollarSuffix?.[1]) return `$${dollarSuffix[1]}`

  const dollarPrefix = pkg.name.match(/\$\s*([\d.]+)/)
  if (dollarPrefix?.[1]) return `$${dollarPrefix[1]}`

  return ''
}

function getPackagePriceAmount(
  pkg: RechargePackageItem,
  iapPriceLabels: Record<string, string>,
): string {
  const productId = getProviderProductId(pkg)
  const displayPrice = productId && iapPriceLabels[productId]
    ? iapPriceLabels[productId]
    : pkg.provider_products?.[getRechargeProvider()]?.display_price?.trim() ?? ''

  if (displayPrice) {
    const match = displayPrice.match(/([\d]+(?:[.,]\d+)?)/)
    if (match?.[1]) return match[1].replace(',', '.')
  }

  const dollarSuffix = pkg.name.match(/([\d.]+)\s*\$/)
  if (dollarSuffix?.[1]) return dollarSuffix[1]

  const dollarPrefix = pkg.name.match(/\$\s*([\d.]+)/)
  if (dollarPrefix?.[1]) return dollarPrefix[1]

  return String(Math.round(pkg.tokens / 100))
}

function RechargeTerms({
  title,
  link,
}: {
  title: string
  link: string
}) {
  const openTerms = () => {
    void Linking.openURL(link)
  }

  return (
    <View style={styles.termsRow}>
      <Text style={styles.termsText}>
        <Trans
          i18nKey="wallet.rechargeAgreement"
          values={{ title }}
          components={{
            terms: <Text style={styles.termsLink} onPress={openTerms} />,
          }}
        />
      </Text>
    </View>
  )
}

export function RechargeSheet({
  open,
  packages,
  packagesLoading,
  packagesError,
  selectedPackageId,
  iapPriceLabels,
  isPurchasing,
  orderError,
  onClose,
  onSelectPackage,
  onRetryPackages,
  onContinue,
  onOpenHistory,
  presentation = 'sheet',
}: RechargeSheetProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { termsList } = useAppTerms(getAccountRegion())
  const totalTokens = useWalletStore(s => s.totalTokens)
  const freeTokens = useWalletStore(s => s.freeTokens)

  const userAgreement = useMemo(
    () => termsList.find(term => normalizeTermsType(term.type) === 'user_agreement' && term.link.trim()),
    [termsList],
  )

  const selectedPackage = useMemo(
    () => packages.find(pkg => pkg.package_id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  )

  const packageRows = useMemo(() => chunkPackages(packages, 3), [packages])

  const handleContinue = () => {
    if (!selectedPackage || isPurchasing) return
    onContinue()
  }

  const rechargeButtonLabel = (() => {
    if (isPurchasing) return t('wallet.processing')
    if (!selectedPackage) return t('wallet.rechargeNow')
    return t('wallet.rechargeDollarNow', {
      amount: getPackagePriceAmount(selectedPackage, iapPriceLabels),
    })
  })()

  const canPay = !!selectedPackage && !packagesLoading && !isPurchasing

  const contentNode = (
    <View style={styles.contentRoot}>
      <View style={styles.heroSection}>
        <Text style={styles.heroEmoji}>🧊</Text>
        <Text style={styles.heroBalance}>{totalTokens ?? 0}</Text>
        <View style={styles.giftBadge}>
          <Text style={styles.giftBadgeText}>
            {t('wallet.includingGiftTokens', { amount: freeTokens ?? 0 })}
          </Text>
        </View>
      </View>

      {packagesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
          <Text style={styles.loadingText}>{t('wallet.loadingPackages')}</Text>
        </View>
      ) : packagesError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{packagesError}</Text>
          <Pressable onPress={onRetryPackages} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>{t('history.retry')}</Text>
          </Pressable>
        </View>
      ) : packages.length === 0 ? (
        <Text style={styles.emptyText}>{t('wallet.noPackages')}</Text>
      ) : (
        <View style={styles.packagesContainer}>
          {packageRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.packageRow}>
              {row.map(pkg => {
                const selected = selectedPackageId === pkg.package_id
                return (
                  <Pressable
                    key={pkg.package_id}
                    onPress={() => onSelectPackage(pkg.package_id)}
                    style={[styles.packageCard, selected && styles.packageCardSelected]}
                  >
                    <View style={styles.packageAmountRow}>
                      <Text style={styles.packageEmoji}>🧊</Text>
                      <Text style={styles.packageAmount}>{formatPackageAmount(pkg)}</Text>
                    </View>
                    <Text style={styles.packagePrice}>
                      {getPackageDisplayPrice(pkg, iapPriceLabels)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        {orderError ? <Text style={styles.orderErrorText}>{orderError}</Text> : null}
        <Pressable
          style={[styles.continueButton, !canPay && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canPay}
        >
          <Text style={styles.continueButtonText}>{rechargeButtonLabel}</Text>
        </Pressable>
      </View>
    </View>
  )

  const termsNode = userAgreement ? (
    <RechargeTerms title={userAgreement.title} link={userAgreement.link.trim()} />
  ) : null

  if (presentation === 'fullscreen') {
    if (!open) return null

    return (
      <FullscreenPage backgroundColor="#dff4ff" zIndex={50}>
        <PageHeaderBar>
          <BackButton onPress={onClose} />
          {onOpenHistory ? (
            <Pressable style={styles.historyButton} onPress={onOpenHistory}>
              <Text style={styles.historyButtonText}>{t('wallet.transactionDetail')}</Text>
            </Pressable>
          ) : null}
        </PageHeaderBar>
        <ScrollView
          style={styles.fullscreenScroll}
          contentContainerStyle={styles.fullscreenScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {contentNode}
        </ScrollView>
        <View style={[styles.fullscreenTerms, { paddingBottom: Math.max(16, insets.bottom) }]}>
          {termsNode}
        </View>
      </FullscreenPage>
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      scrollable={false}
      fitContent
      backgroundColor="#dff4ff"
      footer={termsNode}
    >
      {contentNode}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  contentRoot: {
    position: 'relative',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  heroEmoji: {
    fontSize: 92,
    lineHeight: 92,
  },
  heroBalance: {
    marginTop: 8,
    fontSize: 48,
    fontWeight: '600',
    lineHeight: 48,
    color: '#000000',
  },
  giftBadge: {
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  giftBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  loadingContainer: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 999,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  packagesContainer: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  packageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  packageCard: {
    flex: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  packageCardSelected: {
    borderWidth: 3,
    borderColor: '#000000',
  },
  packageAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packageEmoji: {
    fontSize: 18,
    lineHeight: 18,
  },
  packageAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  orderErrorText: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#dc2626',
  },
  continueButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  termsRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  termsLink: {
    fontWeight: '500',
    color: '#000000',
  },
  historyButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  fullscreenScroll: {
    flex: 1,
    minHeight: 0,
  },
  fullscreenScrollContent: {
    flexGrow: 1,
  },
  fullscreenTerms: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
})
