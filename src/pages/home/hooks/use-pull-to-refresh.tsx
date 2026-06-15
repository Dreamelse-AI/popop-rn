import { useCallback, useState } from 'react'
import { RefreshControl, View, ActivityIndicator, StyleSheet, type RefreshControlProps } from 'react-native'

type UsePullToRefreshOptions = {
  enabled?: boolean
  onRefresh: () => Promise<void>
}

type UsePullToRefreshResult = {
  pullDistance: number
  refreshing: boolean
  refreshControl: React.ReactElement<RefreshControlProps> | undefined
}

export function usePullToRefresh({ enabled = true, onRefresh }: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh, refreshing])

  const refreshControl = enabled ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => void handleRefresh()}
      tintColor="rgba(0,0,0,0.6)"
      colors={['rgba(0,0,0,0.6)']}
    />
  ) : undefined

  return { pullDistance: refreshing ? 72 : 0, refreshing, refreshControl }
}

type PullToRefreshIndicatorProps = {
  pullDistance: number
  refreshing: boolean
}

export function PullToRefreshIndicator({ pullDistance, refreshing }: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !refreshing) return null

  return (
    <View style={[styles.indicator, { height: refreshing ? 40 : pullDistance }]}>
      <ActivityIndicator size="small" color="rgba(0,0,0,0.6)" />
    </View>
  )
}

const styles = StyleSheet.create({
  indicator: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
})
