import { useCallback, useEffect, useRef, useState } from 'react'
import { View, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

import { NewUserRewardModal } from '@/features/auth/components/new-user-reward-modal'
import { takePendingNewUserReward } from '@/features/auth/new-user-reward'
import {
  clearFeedTabLeft,
  markFeedTabLeft,
  saveFeedScrollTop,
  shouldRefreshFeedOnReturn,
  takeFeedScrollTop,
} from '@/features/feed/feed-session'
import type { FeedRefreshOutcome } from '@/features/feed/hooks/use-feed'
import { takePostDynamicPublishSuccess } from '@/features/post-dynamic/lib/post-dynamic-feed-return'
import { Toast, useToast } from '@/shared/ui/toast'
import { BottomNavBar } from './nav/bottom-nav-bar'
import { TagFeed, type TagFeedRef } from './feed/tag-feed'
import { usePullToRefresh } from './hooks/use-pull-to-refresh'
import { MessagesPage } from './messages/messages-page'
import { takeReopenCharacterDrawer, takeReturnToCharacterTab } from './messages/drawer-return-flag'
import { SearchPanel } from './search/search-panel'
import { MePage } from './me-page'
import { TopNavBar } from './nav/top-nav-bar'
import { CreatePage } from './create-page'

const FEED_TOAST = {
  error: '加载失败，请重试',
  no_content: '暂无新内容',
} as const

function showOutcomeToast(outcome: FeedRefreshOutcome, showToast: (msg: string) => void) {
  if (outcome === 'error') {
    showToast(FEED_TOAST.error)
    return
  }
  if (outcome === 'no_content') {
    showToast(FEED_TOAST.no_content)
  }
}

export function HomePage() {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [bottomTab, setBottomTab] = useState('home')
  const [reopenDrawer] = useState(takeReopenCharacterDrawer)
  const [returnToCharacterTab] = useState(takeReturnToCharacterTab)
  const [drawerOpenToken, setDrawerOpenToken] = useState(reopenDrawer ? 1 : 0)
  const [newUserRewardCoins, setNewUserRewardCoins] = useState<number | null>(null)
  const feedScrollRef = useRef<ScrollView>(null)
  const feedScrollOffsetRef = useRef(0)
  const tagFeedRef = useRef<TagFeedRef>(null)
  const prevBottomTabRef = useRef(bottomTab)
  const { toast, showToast } = useToast()

  const scrollFeedToTop = useCallback(() => {
    feedScrollRef.current?.scrollTo({ y: 0, animated: true })
  }, [])

  const runFeedRefresh = useCallback(async () => {
    const outcome = (await tagFeedRef.current?.refresh()) ?? 'error'
    showOutcomeToast(outcome, showToast)
    return outcome
  }, [showToast])

  const scrollFeedToTopAndRefresh = useCallback(async () => {
    scrollFeedToTop()
    await runFeedRefresh()
  }, [runFeedRefresh, scrollFeedToTop])

  const handlePullRefresh = useCallback(async () => {
    await runFeedRefresh()
  }, [runFeedRefresh])

  const isFeedTab = bottomTab === 'home'

  const { refreshControl } = usePullToRefresh({
    enabled: isFeedTab && !searchOpen,
    onRefresh: handlePullRefresh,
  })

  useEffect(() => {
    const coins = takePendingNewUserReward()
    if (coins !== null) {
      setNewUserRewardCoins(coins)
    }
  }, [])

  useEffect(() => {
    const top = takeFeedScrollTop()
    if (top == null) return

    requestAnimationFrame(() => {
      feedScrollRef.current?.scrollTo({ y: top, animated: false })
    })
  }, [])

  useEffect(() => {
    return () => {
      saveFeedScrollTop(feedScrollOffsetRef.current)
    }
  }, [])

  useEffect(() => {
    if (reopenDrawer || returnToCharacterTab) {
      setBottomTab('character')
    }
  }, [])

  // 从角色落地页（匿名匹配加好友成功）返回时，Home 已挂载不会重新读 mount flag，
  // 这里在重新获得焦点时检查 flag：切到角色 tab 并打开角色抽屉（匹配入口侧边栏）
  useFocusEffect(
    useCallback(() => {
      if (takeReopenCharacterDrawer()) {
        setBottomTab('character')
        setDrawerOpenToken(token => token + 1)
      }
    }, []),
  )

  useEffect(() => {
    const prevTab = prevBottomTabRef.current
    if (bottomTab === prevTab) return

    if (prevTab === 'home') {
      markFeedTabLeft()
    }

    if (bottomTab === 'home' && shouldRefreshFeedOnReturn()) {
      clearFeedTabLeft()
      void scrollFeedToTopAndRefresh()
    }

    prevBottomTabRef.current = bottomTab
  }, [bottomTab, scrollFeedToTopAndRefresh])

  const handleNavigateToFeedAfterPost = useCallback(() => {
    setBottomTab('home')
    showToast(t('character.creation.postPublishSuccess'))
    void scrollFeedToTopAndRefresh()
  }, [scrollFeedToTopAndRefresh, showToast, t])

  useEffect(() => {
    if (takePostDynamicPublishSuccess()) {
      handleNavigateToFeedAfterPost()
    }
  }, [handleNavigateToFeedAfterPost])

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (tabId === bottomTab) {
        if (tabId === 'home') {
          void scrollFeedToTopAndRefresh()
        }
        return
      }
      setBottomTab(tabId)
    },
    [bottomTab, scrollFeedToTopAndRefresh],
  )

  const handleFeedScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    feedScrollOffsetRef.current = contentOffset.y
    const remaining = contentSize.height - layoutMeasurement.height - contentOffset.y
    if (remaining < 400) {
      tagFeedRef.current?.tryLoadMore()
    }
  }, [])

  const showHomeChrome = !searchOpen && isFeedTab

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {showHomeChrome && (
        <TopNavBar onSearchPress={() => setSearchOpen(true)} />
      )}

      <View style={styles.contentArea}>
        {/* Feed tab — always mounted, hidden via display */}
        <View style={[styles.tabPanel, styles.absoluteFill, !isFeedTab && styles.hidden]}>
          <ScrollView
            ref={feedScrollRef}
            style={styles.feedScroll}
            contentContainerStyle={styles.feedScrollContent}
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
            onScroll={handleFeedScroll}
            scrollEventThrottle={16}
          >
            <TagFeed ref={tagFeedRef} />
          </ScrollView>
        </View>

        {/* Me tab — always mounted, hidden via display */}
        <View style={[styles.tabPanel, styles.absoluteFill, bottomTab !== 'me' && styles.hidden]}>
          <MePage isActive={bottomTab === 'me'} />
        </View>

        {/* Character tab — always mounted, hidden via display */}
        <View style={[styles.tabPanel, styles.absoluteFill, bottomTab !== 'character' && styles.hidden]}>
          <MessagesPage
            openDrawerOnMount={reopenDrawer}
            openDrawerToken={drawerOpenToken}
            isActive={bottomTab === 'character'}
          />
        </View>

        {/* Create tab — always mounted, hidden via display */}
        <View style={[styles.tabPanel, styles.absoluteFill, bottomTab !== 'create' && styles.hidden]}>
          <CreatePage
            isActive={bottomTab === 'create'}
            onNavigateToFeed={() => setBottomTab('home')}
          />
        </View>
      </View>

      {!searchOpen && (
        <BottomNavBar currentTab={bottomTab} onTabChange={handleTabChange} />
      )}

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      <NewUserRewardModal
        open={newUserRewardCoins !== null}
        coins={newUserRewardCoins ?? 100}
        onClaim={() => setNewUserRewardCoins(null)}
      />

      <Toast message={toast} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  contentArea: {
    flex: 1,
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabPanel: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  feedScroll: {
    flex: 1,
  },
  feedScrollContent: {
    flexGrow: 1,
  },
})
