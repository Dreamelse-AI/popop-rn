/** Chat 模块统一导出 */
export { CharacterChatScreen } from './ui/character-chat-screen';
export type { CharacterChatScreenProps } from './ui/character-chat-screen';
export { ChatNotFound } from './ui/chat-not-found';
export { ChatErrorBoundary, ChatErrorFallback } from './ui/chat-error-boundary';
export { ChatImagePreview } from './ui/chat-image-preview';
export { useCharacterChat } from './hooks/use-character-chat';
export type { CharacterChatActions } from './hooks/use-character-chat';
export type { ChatCharacter, ChatMessage, OutboundPhase } from './model/types';
