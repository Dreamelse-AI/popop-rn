import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { EmojiItem, ListEmojiPanelResp } from '@/generated/arca_apiComponents'
import { normalizeAssetUrl } from '@/shared/lib/normalize-asset-url'

import { EMOJI_PANEL } from '../config/chat-config'
import { getEmojiLabel } from '../lib/character-adapter'
import {
  buildEmojiPanelTabs,
  isEmojiPanelEmpty,
  resolveEmojiPanelTabEmojis,
  type EmojiPanelTab,
} from '../lib/emoji-panel-utils'

type ChatEmojiBottomSheetProps = {
  open: boolean
  panel: ListEmojiPanelResp | null
  loading?: boolean
  fetchFailed?: boolean
  onRetry?: () => void
  onSelect: (emoji: EmojiItem) => void
}

export function ChatEmojiBottomSheet({
  open,
  panel,
  loading = false,
  fetchFailed = false,
  onRetry,
  onSelect,
}: ChatEmojiBottomSheetProps) {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const panelHeight = Math.min(EMOJI_PANEL.heightPx, Math.round(windowHeight * 0.52))
  const tabs = useMemo(() => (panel ? buildEmojiPanelTabs(panel) : []), [panel])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [showScrollFade, setShowScrollFade] = useState(false)
  const tabScrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (!open || tabs.length === 0) return
    if (!tabs.some(tab => tab.id === activeTabId)) {
      const firstPack = tabs.find(tab => tab.kind === 'pack')
      setActiveTabId(firstPack?.id ?? tabs[0]?.id ?? '')
    }
  }, [activeTabId, open, tabs])

  useEffect(() => {
    if (!open) {
      setShowScrollFade(false)
    }
  }, [open])

  const handleGridScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowScrollFade(event.nativeEvent.contentOffset.y > 4)
  }, [])

  if (!open) return null

  const activeTab = tabs.find(tab => tab.id === activeTabId) ?? tabs[0]
  const activeEmojis = panel && activeTab ? resolveEmojiPanelTabEmojis(activeTab, panel) : []
  const showSkeleton = loading && !panel
  const isEmpty = panel ? isEmojiPanelEmpty(panel) : false

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(8, insets.bottom) }]}>
      <View style={[styles.panelCard, { height: panelHeight }]}>
        {tabs.length > 0 && (
          <EmojiPanelTabBar
            tabs={tabs}
            panel={panel}
            activeTabId={activeTabId}
            scrollRef={tabScrollRef}
            onSelect={setActiveTabId}
          />
        )}

        <View style={styles.gridArea}>
          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleGridScroll}
            scrollEventThrottle={16}
          >
            {showSkeleton ? (
              <EmojiGridSkeleton />
            ) : fetchFailed && !panel ? (
              <EmojiPanelError onRetry={onRetry} />
            ) : !activeTab || activeEmojis.length === 0 ? (
              <EmojiPanelEmpty kind={activeTab?.kind ?? 'recent'} isEmpty={isEmpty} />
            ) : (
              <EmojiGrid emojis={activeEmojis} onSelect={onSelect} />
            )}
          </ScrollView>

          {showScrollFade ? (
            <LinearGradient
              colors={['#ffffff', '#ffffff', 'rgba(255,255,255,0)']}
              locations={[0, EMOJI_PANEL.scrollFadeGradientStop, 1]}
              style={styles.scrollFade}
              pointerEvents="none"
            />
          ) : null}
        </View>
      </View>
    </View>
  )
}

type EmojiPanelTabBarProps = {
  tabs: EmojiPanelTab[]
  panel: ListEmojiPanelResp | null
  activeTabId: string
  scrollRef: React.RefObject<ScrollView | null>
  onSelect: (tabId: string) => void
}

function EmojiPanelTabBar({
  tabs,
  panel,
  activeTabId,
  scrollRef,
  onSelect,
}: EmojiPanelTabBarProps) {
  const tabBarSpacerHeight =
    EMOJI_PANEL.tabBarHeightPx - EMOJI_PANEL.tabRowHeightPx - 1

  return (
    <View style={[styles.tabBarContainer, { height: EMOJI_PANEL.tabBarHeightPx }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarContent}
      >
        {tabs.map(tab => {
          const emojis = panel ? resolveEmojiPanelTabEmojis(tab, panel) : []
          const active = tab.id === activeTabId

          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelect(tab.id)}
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              style={[styles.tabButton, { height: EMOJI_PANEL.tabRowHeightPx }]}
            >
              <EmojiPanelTabIcon tab={tab} emojis={emojis} />
              {active ? (
                <View
                  style={[
                    styles.tabIndicator,
                    {
                      width: EMOJI_PANEL.activeIndicatorWidthPx,
                      height: EMOJI_PANEL.activeIndicatorHeightPx,
                    },
                  ]}
                />
              ) : null}
            </Pressable>
          )
        })}
      </ScrollView>

      <View style={[styles.tabDivider, { top: EMOJI_PANEL.tabRowHeightPx }]} />
      <View style={{ height: tabBarSpacerHeight }} />
    </View>
  )
}

function EmojiPanelTabIcon({
  tab,
  emojis,
}: {
  tab: EmojiPanelTab
  emojis: EmojiItem[]
}) {
  const iconUrl =
    tab.kind === 'pack'
      ? tab.coverUrl || emojis[0]?.media.url
      : emojis[0]?.media.url

  if (iconUrl) {
    return (
      <Image
        source={{ uri: normalizeAssetUrl(iconUrl) }}
        style={styles.tabIconImage}
        contentFit="contain"
      />
    )
  }

  if (tab.kind === 'recent') {
    return <RecentTabIcon />
  }

  if (tab.kind === 'my') {
    return <MyTabIcon />
  }

  return <Text style={styles.tabFallbackLabel}>{tab.label.slice(0, 2)}</Text>
}

function RecentTabIcon() {
  return (
    <Svg
      width={EMOJI_PANEL.tabIconMaxWidthPx}
      height={EMOJI_PANEL.tabIconMaxHeightPx}
      viewBox="0 0 48 48"
    >
      <Circle cx="24" cy="24" r="14" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={2} />
      <Path
        d="M24 16v8l5 3"
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function MyTabIcon() {
  return (
    <Svg
      width={EMOJI_PANEL.tabIconMaxWidthPx}
      height={EMOJI_PANEL.tabIconMaxHeightPx}
      viewBox="0 0 48 48"
    >
      <Circle cx="24" cy="18" r="6" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={2} />
      <Path
        d="M12 38c0-6.6 5.4-10 12-10s12 3.4 12 10"
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}

function EmojiGrid({
  emojis,
  onSelect,
}: {
  emojis: EmojiItem[]
  onSelect: (emoji: EmojiItem) => void
}) {
  return (
    <View style={styles.grid}>
      {emojis.map(emoji => (
        <Pressable
          key={emoji.emoji_id}
          onPress={() => onSelect(emoji)}
          style={styles.emojiButton}
          accessibilityLabel={getEmojiLabel(emoji)}
        >
          <EmojiSticker emoji={emoji} />
        </Pressable>
      ))}
    </View>
  )
}

function EmojiGridSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 16 }).map((_, index) => (
        <View key={index} style={styles.skeletonItem} />
      ))}
    </View>
  )
}

function EmojiPanelError({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>表情加载失败</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>重试</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function EmojiPanelEmpty({
  kind,
  isEmpty,
}: {
  kind: EmojiPanelTab['kind']
  isEmpty: boolean
}) {
  const message =
    kind === 'recent'
      ? '暂无最近使用的表情'
      : kind === 'my'
        ? '暂无上传的表情'
        : isEmpty
          ? '暂无表情'
          : '该分组暂无表情'

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  )
}

function EmojiSticker({ emoji }: { emoji: EmojiItem }) {
  const label = getEmojiLabel(emoji)

  if (!emoji.media.url) {
    return <Text style={styles.emojiPlaceholder}>{label}</Text>
  }

  return (
    <Image
      source={{ uri: normalizeAssetUrl(emoji.media.url) }}
      style={styles.emojiStickerImage}
      contentFit="contain"
    />
  )
}

const styles = StyleSheet.create({
  /** 与 chat-input-bar collapsedRow 同宽：左右 16px，对齐加号左缘与输入框右缘 */
  wrapper: {
    paddingTop: 4,
    paddingHorizontal: EMOJI_PANEL.horizontalInsetPx,
  },
  panelCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  tabBarContainer: {
    position: 'relative',
  },
  tabBarContent: {
    paddingHorizontal: 16,
    gap: 24,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  tabIconImage: {
    width: EMOJI_PANEL.tabIconMaxWidthPx,
    height: EMOJI_PANEL.tabIconMaxHeightPx,
  },
  tabFallbackLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 9999,
    backgroundColor: '#000000',
  },
  tabDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  gridArea: {
    flex: 1,
    position: 'relative',
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  scrollFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: EMOJI_PANEL.scrollFadeHeightPx,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 16,
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: '23%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiStickerImage: {
    width: '100%',
    height: '100%',
  },
  emojiPlaceholder: {
    paddingHorizontal: 4,
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  skeletonItem: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  emptyContainer: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.7)',
  },
})
