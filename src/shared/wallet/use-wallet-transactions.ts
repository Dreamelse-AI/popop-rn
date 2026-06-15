import { useCallback, useEffect, useRef, useState } from 'react';

import { walletTransactions } from '@/generated/arca_api';
import type { WalletTransactionItem } from '@/generated/arca_apiComponents';

const PAGE_SIZE = 20;

function hasMoreCursor(cursor: string): boolean {
  return cursor !== '0' && cursor !== '';
}

export type WalletTransactionTab = 'income' | 'expense';

export function useWalletTransactions(tab: WalletTransactionTab) {
  const [items, setItems] = useState<WalletTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const nextCursorRef = useRef('0');
  const requestIdRef = useRef(0);

  const loadInitial = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setItems([]);
    nextCursorRef.current = '0';
    setHasMore(false);

    try {
      const resp = await walletTransactions({
        bill_category: tab,
        limit: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;

      setItems(resp.items);
      nextCursorRef.current = resp.next_cursor;
      setHasMore(hasMoreCursor(resp.next_cursor));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [tab]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || !hasMoreCursor(nextCursorRef.current)) return;

    const requestId = ++requestIdRef.current;
    setLoadingMore(true);

    try {
      const resp = await walletTransactions({
        bill_category: tab,
        cursor: Number(nextCursorRef.current),
        limit: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;

      setItems(prev => {
        const seen = new Set(prev.map(item => item.id));
        const appended = resp.items.filter(item => !seen.has(item.id));
        return [...prev, ...appended];
      });
      nextCursorRef.current = resp.next_cursor;
      setHasMore(hasMoreCursor(resp.next_cursor));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingMore(false);
      }
    }
  }, [hasMore, loading, loadingMore, tab]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    retry: loadInitial,
  };
}
