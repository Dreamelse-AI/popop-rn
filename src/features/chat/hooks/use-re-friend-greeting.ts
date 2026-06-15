import { useEffect, useRef } from 'react';

import { chatWithCharacter } from '../api/chat-api';
import { RE_FRIEND_GREETING_PROMPT } from '../config/chat-config';
import {
  excludeDisplayMessagesByServerMessageIds,
} from '../lib/phone-message-adapter';
import {
  takeReFriendHandoff,
  takeReFriendPending,
} from '../lib/re-friend-handoff';
import { isActiveChatSession } from '../lib/session-guard';
import { useChatSessionStore } from '../store/chat-session-store';

import type { ReplyPlaybackControls } from './use-reply-playback';

function excludeHandoffMessagesFromDisplay(
  serverMessageIds: ReadonlySet<string>,
) {
  if (serverMessageIds.size === 0) return;

  const { messages, setMessages } = useChatSessionStore.getState();
  setMessages(excludeDisplayMessagesByServerMessageIds(messages, serverMessageIds));
}

/** 重新加好友：历史已含系统气泡，打招呼逐条播放或请求模型生成 */
export function useReFriendGreeting(
  characterId: string,
  isLoadingHistory: boolean,
  hasCharacter: boolean,
  playback: ReplyPlaybackControls,
) {
  const handledRef = useRef(false);

  useEffect(() => {
    handledRef.current = false;
  }, [characterId]);

  useEffect(() => {
    if (handledRef.current || !characterId || !hasCharacter || isLoadingHistory) return;

    const handoff = takeReFriendHandoff(characterId);
    if (handoff) {
      handledRef.current = true;

      const serverMessageIds = new Set(
        handoff.characterMessages
          .map(message => message.message_id)
          .filter((id): id is string => Boolean(id)),
      );
      excludeHandoffMessagesFromDisplay(serverMessageIds);
      playback.startPlayback(characterId, handoff.characterMessages);
      return;
    }

    if (!takeReFriendPending(characterId)) return;

    handledRef.current = true;
    let cancelled = false;

    const { setTyping, setOutboundPhase, setCharacterStatus } = useChatSessionStore.getState();
    setTyping(true);
    setOutboundPhase('awaitingApi');

    void (async () => {
      try {
        const resp = await chatWithCharacter({
          character_id: characterId,
          chat_scene: 1,
          messages: [{ msg_type: 'text', text: { text: RE_FRIEND_GREETING_PROMPT } }],
        });

        if (cancelled || !isActiveChatSession(characterId)) return;

        setCharacterStatus(resp.character_status);

        if (resp.character_messages.length > 0) {
          const serverMessageIds = new Set(
            resp.character_messages
              .map(message => message.message_id)
              .filter((id): id is string => Boolean(id)),
          );
          excludeHandoffMessagesFromDisplay(serverMessageIds);
          playback.startPlayback(characterId, resp.character_messages);
          return;
        }

        setTyping(false);
        setOutboundPhase('idle');
      } catch {
        if (!cancelled && isActiveChatSession(characterId)) {
          setTyping(false);
          setOutboundPhase('idle');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [characterId, hasCharacter, isLoadingHistory, playback]);
}
