import { useCallback, useState } from 'react'
import { View, StyleSheet } from 'react-native'

import type { MessageConversation } from './types'
import { MessagesConversationRow } from './messages-conversation-row'
import { MessagesRowMenu } from './messages-row-menu'

type MessagesConversationListProps = {
  items: MessageConversation[]
  onPin: (conversationId: string) => void | Promise<void>
  onEndRelation: (conversationId: string) => void | Promise<void>
  onSelect: (conversationId: string) => void
}

export function MessagesConversationList({
  items,
  onPin,
  onEndRelation,
  onSelect,
}: MessagesConversationListProps) {
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null)

  const handlePin = useCallback(() => {
    if (!menuConversationId) return
    const targetId = menuConversationId
    setMenuConversationId(null)
    void Promise.resolve(onPin(targetId))
  }, [menuConversationId, onPin])

  const handleEndRelation = useCallback(() => {
    if (!menuConversationId) return
    const targetId = menuConversationId
    setMenuConversationId(null)
    void Promise.resolve(onEndRelation(targetId))
  }, [menuConversationId, onEndRelation])

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <MessagesConversationRow
          key={item.id}
          item={item}
          showDivider={index < items.length - 1}
          onOpenMenu={() => setMenuConversationId(item.id)}
          onPress={() => onSelect(item.id)}
        />
      ))}

      <MessagesRowMenu
        open={menuConversationId !== null}
        onClose={() => setMenuConversationId(null)}
        onPin={handlePin}
        onEndRelation={handleEndRelation}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
})
