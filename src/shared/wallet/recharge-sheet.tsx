import { useMemo, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import type { RechargePackageItem } from '@/generated/arca_apiComponents'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { SheetFooterButton } from '@/shared/ui/sheet-primitives'

import { getProviderProductId } from './iap-utils'
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

function getPackagePriceLabel(
  pkg: RechargePackageItem,
  iapPriceLabels: Record<string, string>,
): string {
  const productId = getProviderProductId(pkg)
  if (productId && iapPriceLabels[productId]) {
    return iapPriceLabels[productId]
  }

  const dollarSuffix = pkg.name.match(/([\d.]+)\s*\$/)
  if (dollarSuffix?.[1]) return `$${dollarSuffix[1]}`

  const dollarPrefix = pkg.name.match(/\$\s*([\d.]+)/)
  if (dollarPrefix?.[1]) return `$${dollarPrefix[1]}`

  return pkg.name
}

function AgreeCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <View style={styles.agreeRow}>
      <Pressable onPress={onToggle} style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && (
          <Svg width={10} height={8} viewBox="0 0 10 8" fill="none">
            <Path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </Pressable>
      <Text style={styles.agreeText}>
        I have read and agree to <Text style={styles.agreeLink}>Top-up Terms & Policy</Text>
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
}: RechargeSheetProps) {
  const [agreed, setAgreed] = useState(false)
  const totalTokens = useWalletStore(s => s.totalTokens)
  const isOutOfCubes = (totalTokens ?? 0) === 0

  const selectedPackage = useMemo(
    () => packages.find(pkg => pkg.package_id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  )

  const packageRows = useMemo(() => chunkPackages(packages, 3), [packages])

  const handleContinue = () => {
    if (!agreed || !selectedPackage || isPurchasing) return
    onContinue()
  }

  const selectedPriceLabel = selectedPackage
    ? getPackagePriceLabel(selectedPackage, iapPriceLabels)
    : null

  const rechargeButtonLabel = (() => {
    if (isPurchasing) return 'Processing...'
    if (!selectedPackage) return 'Recharge Now'
    if (isOutOfCubes && selectedPriceLabel) {
      return `Recharge ${selectedPriceLabel} Now`
    }
    return `Recharge ${formatPackageAmount(selectedPackage)} Now`
  })()

  const canPay = agreed && !!selectedPackage && !packagesLoading && !isPurchasing

  return (
    <BottomSheet open={open} onClose={onClose} scrollable={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {isOutOfCubes ? (
          <View style={styles.headerOutOfCubes}>
            <View style={styles.balanceBadge}>
              <Text style={styles.balanceEmoji}>🧊</Text>
              <Text style={styles.balanceText}>0</Text>
            </View>
            <Text style={styles.outOfCubesTitle}>Out of Cubes !</Text>
            <Text style={styles.heroEmoji}>🧊</Text>
          </View>
        ) : (
          <View style={styles.headerNormal}>
            <Text style={styles.heroEmoji}>🧊</Text>
            <Text style={styles.headerSubtitle}>Recharge Cubes</Text>
            <Text style={styles.totalTokens}>{totalTokens ?? 0}</Text>
          </View>
        )}

        {packagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
            <Text style={styles.loadingText}>Loading packages...</Text>
          </View>
        ) : packagesError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{packagesError}</Text>
            <Pressable onPress={onRetryPackages} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : packages.length === 0 ? (
          <Text style={styles.emptyText}>No packages available</Text>
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
                        {getPackagePriceLabel(pkg, iapPriceLabels)}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          {orderError ? (
            <Text style={styles.orderErrorText}>{orderError}</Text>
          ) : null}
          <SheetFooterButton
            label={rechargeButtonLabel}
            onPress={handleContinue}
            disabled={!canPay}
          />
        </View>

        <AgreeCheckbox checked={agreed} onToggle={() => setAgreed(a => !a)} />
      </ScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  headerOutOfCubes: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  balanceBadge: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  balanceEmoji: {
    fontSize: 16,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  outOfCubesTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  headerNormal: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  heroEmoji: {
    fontSize: 100,
    marginTop: 16,
  },
  headerSubtitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  totalTokens: {
    marginTop: 6,
    fontSize: 48,
    fontWeight: '900',
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
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  packageRow: {
    flexDirection: 'row',
    gap: 6,
  },
  packageCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    paddingVertical: 16,
  },
  packageCardSelected: {
    borderColor: 'transparent',
    backgroundColor: '#fdeab3',
  },
  packageAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  packageEmoji: {
    fontSize: 20,
  },
  packageAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  packagePrice: {
    fontSize: 14,
    color: '#000000',
  },
  footer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 16,
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
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  agreeText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    flex: 1,
  },
  agreeLink: {
    fontWeight: '500',
    color: '#000000',
  },
})
