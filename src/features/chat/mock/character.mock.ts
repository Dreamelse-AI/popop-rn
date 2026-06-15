import type { MessageConversation } from '@/pages/home/messages/types';
import { MOCK_MESSAGE_CONVERSATIONS, MOCK_MESSAGE_SCENE } from '@/pages/home/messages/mock-data';

import type { ChatCharacter } from '../model/types';

export type { ChatCharacter };

/** @deprecated 仅用于消息列表 Mock 跳转，聊天页已改接 getCharacterDetail */
export function getChatCharacter(characterId: string): ChatCharacter | null {
  const conversation = MOCK_MESSAGE_CONVERSATIONS.find((item: MessageConversation) => item.id === characterId);
  if (!conversation) return null;

  return {
    id: conversation.id,
    name: conversation.name,
    avatar: conversation.avatar,
    sceneTag: MOCK_MESSAGE_SCENE.tag,
  };
}

export function getConversationById(conversationId: string): MessageConversation | undefined {
  return MOCK_MESSAGE_CONVERSATIONS.find((item: MessageConversation) => item.id === conversationId);
}
