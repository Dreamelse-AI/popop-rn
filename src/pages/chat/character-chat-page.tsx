import { useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'

import { CharacterChatScreen } from '@/features/chat/ui/character-chat-screen'
import { ChatNotFound } from '@/features/chat/ui/chat-not-found'
import { useCharacterChat } from '@/features/chat/hooks/use-character-chat'

type CharacterChatPageProps = {
  characterId: string
  onBack: () => void
  onOpenProfile: (characterId: string) => void
}

export function CharacterChatPage({ characterId, onBack, onOpenProfile }: CharacterChatPageProps) {
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

  return <CharacterChatScreen {...chat.screen} />
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fbf2d8',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
