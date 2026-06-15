import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'

import type { EmojiItem, ListEmojiPanelResp } from '@/generated/arca_apiComponents'

import { getEmojiLabel } from '../lib/character-adapter'
import {
  buildEmojiPanelTabs,
  isEmojiPanelEmpty,
  resolveEmojiPanelTabEmojis,
  type EmojiPanelTab,
} from '../lib/emoji-panel-utils'
import { Image } from 'expo-image'

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
  const tabs = useMemo(() => (panel ? buildEmojiPanelTabs(panel) : []), [panel])
  const [activeTabId, setActiveTabId] = useState<string>('')

  useEffect(() => {
    if (!open || tabs.length === 0) return
    if (!tabs.some(tab => tab.id === activeTabId)) {
      const firstPack = tabs.find(tab => tab.kind === 'pack')
      setActiveTabId(firstPack?.id ?? tabs[0]?.id ?? '')
    }
  }, [activeTabId, open, tabs])

  if (!open) return null

  const activeTab = tabs.find(tab => tab.id === activeTabId) ?? tabs[0]
  const activeEmojis = panel && activeTab ? resolveEmojiPanelTabEmojis(activeTab, panel) : []
  const showSkeleton = loading && !panel
  const isEmpty = panel ? isEmojiPanelEmpty(panel) : false

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        {/* Tab bar */}
        {tabs.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
            {tabs.map(tab => {
              const active = tab.id === activeTabId
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTabId(tab.id)}
                  style={styles.tabButton}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label.slice(0, 4)}
                  </Text>
                  {active && <View style={styles.tabIndicator} />}
                </Pressable>
              )
            })}
          </ScrollView>
        )}

        <View style={styles.divider} />

        {/* Emoji grid */}
        <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridContent}>
          {showSkeleton ? (
            <View style={styles.grid}>
              {Array.from({ length: 16 }).map((_, i) => (
                <View key={i} style={styles.skeletonItem} />
              ))}
            </View>
          ) : fetchFailed && !panel ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>表情加载失败</Text>
              {onRetry && (
                <Pressable onPress={onRetry} style={styles.retryButton}>
                  <Text style={styles.retryText}>重试</Text>
                </Pressable>
              )}
            </View>
          ) : !activeTab || activeEmojis.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无表情</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {activeEmojis.map(emoji => (
                <Pressable
                  key={emoji.emoji_id}
                  onPress={() => onSelect(emoji)}
                  style={styles.emojiButton}
                  accessibilityLabel={getEmojiLabel(emoji)}
                >
                  {emoji.media.url ? (
                    <Image source={{ uri: emoji.media.url }} style={styles.emojiImage} />
                  ) : (
                    <Text style={styles.emojiPlaceholder}>{getEmojiLabel(emoji).slice(0, 2)}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  panel: {
    height: 328,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  tabBar: {
    paddingHorizontal: 16,
    gap: 20,
    height: 48,
    alignItems: 'center',
  },
  tabButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.4)',
  },
  tabLabelActive: {
    color: '#000000',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#000000',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    width: '23%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  emojiPlaceholder: {
    fontSize: 10,
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
