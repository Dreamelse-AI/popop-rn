import { useCallback, useState } from 'react'
import { View, StyleSheet } from 'react-native'

import type { MessageConversation } from './types'
import { MessagesConversationRow } from './messages-conversation-row'
import { MessagesRowMenu, type MessagesRowMenuAnchor } from './messages-row-menu'

type MessagesConversationListProps = {
  items: MessageConversation[]
  /** 未置顶会话仅剩一条时不展示置顶项 */
  showPinOption?: boolean
  onPin: (conversationId: string) => void | Promise<void>
  onEndRelation: (conversationId: string) => void | Promise<void>
  onSelect: (conversationId: string) => void
}

type MenuState = {
  id: string
  anchor: MessagesRowMenuAnchor
}

export function MessagesConversationList({
  items,
  showPinOption = true,
  onPin,
  onEndRelation,
  onSelect,
}: MessagesConversationListProps) {
  const [menuState, setMenuState] = useState<MenuState | null>(null)

  const handlePin = useCallback(() => {
    if (!menuState) return
    const targetId = menuState.id
    setMenuState(null)
    void Promise.resolve(onPin(targetId))
  }, [menuState, onPin])

  const handleEndRelation = useCallback(() => {
    if (!menuState) return
    const targetId = menuState.id
    setMenuState(null)
    void Promise.resolve(onEndRelation(targetId))
  }, [menuState, onEndRelation])

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <MessagesConversationRow
          key={item.id}
          item={item}
          showDivider={index < items.length - 1}
          onOpenMenu={anchor => setMenuState({ id: item.id, anchor })}
          onPress={() => onSelect(item.id)}
        />
      ))}

      <MessagesRowMenu
        open={menuState !== null}
        anchor={menuState?.anchor ?? null}
        onClose={() => setMenuState(null)}
        onPin={handlePin}
        onEndRelation={handleEndRelation}
        hidePin={!showPinOption}
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
