import type {
  ChatWithCharacterReq,
  ChatWithCharacterResp,
  GetCharacterDetailReq,
  GetCharacterDetailResp,
  ListCharacterPhoneChatHistoryReq,
  ListCharacterPhoneChatHistoryResp,
  ListCharacterScheduleByDayReq,
  ListCharacterScheduleByDayResp,
  ListEmojiPanelResp,
  MarkEmojiUsedReq,
  MarkEmojiUsedResp,
  MemoryRollbackReq,
  MemoryRollbackResp,
  UpdateMessageClickStatusReq,
  UpdateMessageClickStatusResp,
  UpdateMessageReadStatusReq,
  UpdateMessageReadStatusResp,
} from '@/generated/arca_apiComponents';
import * as real from '@/generated/arca_api';

import { enrichChatWithCharacterReq } from '../lib/resolve-friendship-id';

export function chatWithCharacter(req: ChatWithCharacterReq): Promise<ChatWithCharacterResp> {
  const enriched = enrichChatWithCharacterReq(req);
  return real.chatWithCharacter(enriched);
}

export function listCharacterPhoneChatHistory(
  req: ListCharacterPhoneChatHistoryReq,
): Promise<ListCharacterPhoneChatHistoryResp> {
  return real.list_character_phone_chat_history(req);
}

export function listEmojiPanel(): Promise<ListEmojiPanelResp> {
  return real.listEmojiPanel();
}

export function markEmojiUsed(req: MarkEmojiUsedReq): Promise<MarkEmojiUsedResp> {
  return real.markEmojiUsed(req);
}

export function memoryRollback(req: MemoryRollbackReq): Promise<MemoryRollbackResp> {
  return real.memoryRollback(req);
}

export function updateMessageClickStatus(
  req: UpdateMessageClickStatusReq,
): Promise<UpdateMessageClickStatusResp> {
  return real.updateMessageClickStatus(req);
}

export function updateMessageReadStatus(
  req: UpdateMessageReadStatusReq,
): Promise<UpdateMessageReadStatusResp> {
  return real.updateMessageReadStatus(req);
}

export function getCharacterDetail(req: GetCharacterDetailReq): Promise<GetCharacterDetailResp> {
  return real.getCharacterDetail(req);
}

export function listCharacterScheduleByDay(
  req: ListCharacterScheduleByDayReq,
): Promise<ListCharacterScheduleByDayResp> {
  return real.listCharacterScheduleByDay(req);
}

export const USE_MOCK = false;
