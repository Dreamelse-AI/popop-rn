import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'

import { useAuthStore } from '@/features/auth/auth-store'
import { useFriendshipList } from '@/features/friendship/hooks/use-friendship-list'

import { MessagesCharacterDrawer } from './messages-character-drawer'
import { MessagesConversationList } from './messages-conversation-list'
import { MessagesEmptyState } from './messages-empty-state'
import { MessagesHeader } from './messages-header'
import { MessagesPinnedRow } from './messages-pinned-row'
import { MessagesSceneBanner } from './messages-scene-banner'
import { markReturnToCharacterTab } from './drawer-return-flag'

type MessagesPageProps = {
  openDrawerOnMount?: boolean
  isActive?: boolean
}

export function MessagesPage({
  openDrawerOnMount = false,
  isActive = true,
}: MessagesPageProps) {
  const { t } = useTranslation()
  const hasToken = useAuthStore(s => Boolean(s.token))
  const [drawerOpen, setDrawerOpen] = useState(openDrawerOnMount)
  const {
    items: characterListItems,
    conversations,
    scene,
    loading,
    error,
    pinFriend,
    unpinFriend,
    removeFriends,
    refresh,
  } = useFriendshipList(hasToken)

  useEffect(() => {
    if (!hasToken || !isActive) return
    void refresh()
  }, [hasToken, isActive, refresh])

  const pinnedCharacters = useMemo(
    () => {
      const previewById = new Map(conversations.map(item => [item.id, item.preview]))
      return characterListItems
        .filter(item => item.pinned)
        .map(item => ({
          id: item.id,
          name: item.name,
          avatar: item.avatar,
          unread: item.unread,
          preview: previewById.get(item.id) ?? '',
        }))
    },
    [characterListItems, conversations],
  )

  const pinnedCharacterIds = useMemo(
    () => pinnedCharacters.map(item => item.id),
    [pinnedCharacters],
  )

  const listConversations = useMemo(
    () => conversations.filter(item => !pinnedCharacterIds.includes(item.id)),
    [conversations, pinnedCharacterIds],
  )

  const handlePin = useCallback(
    async (characterId: string) => {
      await pinFriend(characterId)
    },
    [pinFriend],
  )

  const handleUnpin = useCallback(
    async (characterId: string) => {
      await unpinFriend(characterId)
    },
    [unpinFriend],
  )

  const handleEndRelation = useCallback(
    async (characterId: string) => {
      await removeFriends([characterId])
    },
    [removeFriends],
  )

  const handleDeleteCharacters = useCallback(
    async (characterIds: string[]) => {
      await removeFriends(characterIds)
    },
    [removeFriends],
  )

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      navigation.navigate('CharacterChat', { characterId: conversationId })
    },
    [navigation],
  )

  const hasConversations = conversations.length > 0

  if (loading && !hasConversations) {
    return (
      <View style={styles.container}>
        <MessagesHeader onMenuPress={() => setDrawerOpen(true)} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('messages.loading', '加载中…')}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MessagesHeader onMenuPress={() => setDrawerOpen(true)} />

      {error && !hasConversations ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('messages.loadFailed', '加载失败，请稍后重试')}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}>
            <Text style={styles.retryText}>{t('messages.retry', '重试')}</Text>
          </Pressable>
        </View>
      ) : hasConversations ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <MessagesSceneBanner scene={scene} />
          <MessagesPinnedRow
            items={pinnedCharacters}
            onSelect={handleSelectConversation}
            onUnpin={handleUnpin}
            onEndRelation={handleEndRelation}
          />
          <MessagesConversationList
            items={listConversations}
            onPin={handlePin}
            onEndRelation={handleEndRelation}
            onSelect={handleSelectConversation}
          />
        </ScrollView>
      ) : (
        <MessagesEmptyState
          onAddFriend={() => {
            markReturnToCharacterTab()
            setDrawerOpen(true)
          }}
        />
      )}

      <MessagesCharacterDrawer
        open={drawerOpen}
        items={characterListItems}
        loading={loading}
        error={error}
        onClose={() => setDrawerOpen(false)}
        onPin={handlePin}
        onUnpin={handleUnpin}
        onEndRelation={handleEndRelation}
        onDeleteCharacters={handleDeleteCharacters}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
})
