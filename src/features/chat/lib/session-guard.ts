import { useChatSessionStore } from '../store/chat-session-store';

/** 当前 store 是否仍展示该角色的会话（切换角色后应忽略旧角色的异步回写） */
export function isActiveChatSession(characterId: string): boolean {
  return useChatSessionStore.getState().characterId === characterId;
}
