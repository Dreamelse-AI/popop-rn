import type { PhoneMessageOutput } from '@/generated/arca_apiComponents';

import { buildPlaybackUnits } from './phone-message-adapter';
import { markCharacterMessagesReadFromOutputs } from './mark-messages-read';
import { isActiveChatSession } from './session-guard';
import { useChatSessionStore } from '../store/chat-session-store';

/** 跳过逐字播放，一次性写入角色回复并结束输入中状态 */
export function deliverCharacterRepliesImmediately(
  characterId: string,
  outputs: PhoneMessageOutput[],
): void {
  if (!isActiveChatSession(characterId)) return;

  const { emojiDescriptions, appendMessages, setTyping, setOutboundPhase } =
    useChatSessionStore.getState();
  const units = buildPlaybackUnits(outputs, { emojiDescriptions });
  appendMessages(units.map(unit => unit.message));
  setTyping(false);
  setOutboundPhase('idle');
  markCharacterMessagesReadFromOutputs(characterId, outputs);
}
