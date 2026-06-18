import { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  formatWalletTransactionAmount,
  formatWalletTransactionDate,
  getWalletTransactionNote,
  getWalletTransactionTitle,
} from '@/shared/wallet/wallet-transaction-utils'
import { useWalletTransactions } from '@/shared/wallet/use-wallet-transactions'
import { FullscreenPage, PageHeaderBar, BackButton } from '@/shared/ui/fullscreen-page'

type HistoryPageProps = {
  onBack: () => void
}

export function HistoryPage({ onBack }: HistoryPageProps) {
  const [tab, setTab] = useState<'income' | 'expense'>('income')
  const { t, i18n } = useTranslation()
  const { items, loading, loadingMore, error, hasMore, loadMore, retry } = useWalletTransactions(tab)

  const handleEndReached = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      void loadMore()
    }
  }, [hasMore, loadMore, loading, loadingMore])

  return (
    <FullscreenPage zIndex={60}>
      <PageHeaderBar>
        <BackButton onPress={onBack} />
        <View style={styles.tabRow}>
          <Pressable style={styles.tabButton} onPress={() => setTab('income')}>
            <Text style={[styles.tabLabel, tab !== 'income' && styles.tabLabelInactive]}>
              {t('history.income')}
            </Text>
            {tab === 'income' && <View style={styles.tabIndicator} />}
          </Pressable>
          <Pressable style={styles.tabButton} onPress={() => setTab('expense')}>
            <Text style={[styles.tabLabel, tab !== 'expense' && styles.tabLabelInactive]}>
              {t('history.expense')}
            </Text>
            {tab === 'expense' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>
      </PageHeaderBar>

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
            <Text style={styles.stateText}>{t('history.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => void retry()}>
              <Text style={styles.retryText}>{t('history.retry')}</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>{t('history.empty')}</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.listContent}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            renderItem={({ item }) => {
              const note = getWalletTransactionNote(item)
              return (
                <View style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>
                      {getWalletTransactionTitle(item, t)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatWalletTransactionDate(item.created_at, i18n.language)}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>
                      {formatWalletTransactionAmount(item.amount)}
                    </Text>
                    {note ? <Text style={styles.transactionNote}>{note}</Text> : null}
                  </View>
                </View>
              )
            }}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
                  <Text style={styles.stateText}>{t('history.loadingMore')}</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </FullscreenPage>
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
  listContainer: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  centerState: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  stateText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#000000',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
  },
  transactionLeft: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingRight: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  transactionDate: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  transactionRight: {
    flexShrink: 0,
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  transactionNote: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
})
