import { useCallback, useEffect, useRef, useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { NewUserRewardModal } from '@/features/auth/components/new-user-reward-modal'
import { takePendingNewUserReward } from '@/features/auth/new-user-reward'
import {
  clearFeedTabLeft,
  markFeedTabLeft,
  shouldRefreshFeedOnReturn,
} from '@/features/feed/feed-session'
import type { FeedRefreshOutcome } from '@/features/feed/hooks/use-feed'
import { takePostDynamicPublishSuccess } from '@/features/post-dynamic'
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

import LogoPopop from '@/shared/assets/feed/icon/Group 2117132529.svg'

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
  const [newUserRewardCoins, setNewUserRewardCoins] = useState<number | null>(null)
  const feedScrollRef = useRef<ScrollView>(null)
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
    if (reopenDrawer || returnToCharacterTab) {
      setBottomTab('character')
    }
  }, [])

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

  const showHomeChrome = !searchOpen && isFeedTab
  const showMeChrome = !searchOpen && bottomTab === 'me'

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {showHomeChrome && (
        <TopNavBar onSearchPress={() => setSearchOpen(true)} />
      )}

      {showMeChrome && (
        <View style={styles.meHeader}>
          <LogoPopop width={190} height={30} />
        </View>
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
          >
            <TagFeed ref={tagFeedRef} />
          </ScrollView>
        </View>

        {/* Me tab — always mounted, hidden via display */}
        <View style={[styles.tabPanel, styles.absoluteFill, bottomTab !== 'me' && styles.hidden]}>
          <MePage />
        </View>

        {/* Character tab — always mounted, hidden via display */}
        <View style={[styles.tabPanel, styles.absoluteFill, bottomTab !== 'character' && styles.hidden]}>
          <MessagesPage
            onSearchPress={() => setSearchOpen(true)}
            openDrawerOnMount={reopenDrawer}
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
  meHeader: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
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
