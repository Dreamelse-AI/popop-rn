import { useCallback, useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'

import { FeedPostViewer, formatCharacterProfilePostTime, mapPostDetail } from '@/features/post'
import type { PostDetailView } from '@/features/post'
import { CharacterChatScreen } from '@/features/chat/ui/character-chat-screen'
import { ChatErrorBoundary, ChatErrorFallback } from '@/features/chat/ui/chat-error-boundary'
import { ChatImagePreview } from '@/features/chat/ui/chat-image-preview'
import { ChatNotFound } from '@/features/chat/ui/chat-not-found'
import { useCharacterChat } from '@/features/chat/hooks/use-character-chat'
import type { ChatMessage } from '@/features/chat/model/types'
import { getPostDetail } from '@/generated'
import { Toast } from '@/shared/ui/toast'

type CharacterChatPageProps = {
  characterId: string
  onBack: () => void
  onOpenProfile: (characterId: string) => void
}

export function CharacterChatPage({ characterId, onBack, onOpenProfile }: CharacterChatPageProps) {
  const [boundaryKey, setBoundaryKey] = useState(0)
  const [postDetail, setPostDetail] = useState<PostDetailView | null>(null)

  const openProfile = useCallback(
    (id: string) => {
      onOpenProfile(id)
    },
    [onOpenProfile],
  )

  const chat = useCharacterChat(characterId, {
    onBack,
    onOpenProfile: openProfile,
  })

  const handleShareCardPress = useCallback(
    (message: Extract<ChatMessage, { type: 'share_card' }>) => {
      if (!message.sourceId) return
      void getPostDetail({ post_id: message.sourceId, source: 'direct' }).then(resp => {
        if (resp.post) {
          setPostDetail(mapPostDetail(resp.post))
        }
      })
    },
    [],
  )

  if (chat.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="rgba(0,0,0,0.3)" />
      </View>
    )
  }

  if (!chat.character || !chat.screen) {
    return <ChatNotFound onBack={onBack} />
  }

  return (
    <ChatErrorBoundary
      key={boundaryKey}
      fallback={
        <ChatErrorFallback
          onBack={onBack}
          onRetry={() => setBoundaryKey(key => key + 1)}
        />
      }
    >
      <CharacterChatScreen
        {...chat.screen}
        onShareCardPress={handleShareCardPress}
      />
      <ChatImagePreview imageUrl={chat.previewImageUrl} onClose={chat.onPreviewImageClose} />
      {postDetail && (
        <FeedPostViewer
          images={postDetail.images}
          characterName={postDetail.characterName}
          characterAvatar={postDetail.characterAvatar}
          characterId={postDetail.characterId}
          content={postDetail.content}
          timeAgo={formatCharacterProfilePostTime(postDetail.publishedAtMs)}
          musicName={postDetail.bgmName}
          isLiked={postDetail.isLiked}
          postId={postDetail.postId}
          onClose={() => setPostDetail(null)}
        />
      )}
      <Toast message={chat.toast} />
    </ChatErrorBoundary>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fbf2d8',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
