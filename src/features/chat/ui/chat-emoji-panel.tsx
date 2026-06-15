import type { EmojiItem, ListEmojiPanelResp } from '@/generated/arca_apiComponents'

import { ChatEmojiBottomSheet } from './chat-emoji-bottom-sheet'

type ChatEmojiPanelProps = {
  open: boolean
  panel: ListEmojiPanelResp | null
  loading?: boolean
  onSelect: (emoji: EmojiItem) => void
}

export function ChatEmojiPanel(props: ChatEmojiPanelProps) {
  return <ChatEmojiBottomSheet {...props} />
}

export { ChatEmojiBottomSheet }
