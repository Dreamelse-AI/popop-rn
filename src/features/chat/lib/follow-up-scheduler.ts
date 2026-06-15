import { chatWithCharacter } from '../api/chat-api';
import { runPaidAction } from '@/shared/wallet';
import { FOLLOW_UP_DELAY_MS, FOLLOW_UP_PROMPT } from '../config/chat-config';
import { useChatSessionStore } from '../store/chat-session-store';

import { deliverCharacterRepliesImmediately } from './reply-delivery';
import { isActiveChatSession } from './session-guard';

function randomFollowUpDelayMs() {
  const { min, max } = FOLLOW_UP_DELAY_MS;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const consumedByCharacter = new Map<string, boolean>();
const timerByCharacter = new Map<string, number>();
const firingByCharacter = new Set<string>();
let phaseWatcherReady = false;

function clearTimer(characterId: string) {
  const timerId = timerByCharacter.get(characterId);
  if (timerId !== undefined) {
    clearTimeout(timerId);
    timerByCharacter.delete(characterId);
  }
}

function syncFollowUpConsumedToStore(characterId: string) {
  const consumed = consumedByCharacter.get(characterId) ?? false;
  if (isActiveChatSession(characterId)) {
    useChatSessionStore.setState({ followUpConsumed: consumed });
  }
}

async function fireFollowUp(characterId: string) {
  timerByCharacter.delete(characterId);

  if (consumedByCharacter.get(characterId)) return;
  if (firingByCharacter.has(characterId)) return;

  const { outboundPhase } = useChatSessionStore.getState();
  const isForeground = isActiveChatSession(characterId);

  // 仅当用户正在该角色页且会话繁忙时阻塞；切到其他角色后允许后台触发
  if (isForeground && outboundPhase !== 'idle') return;

  firingByCharacter.add(characterId);
  consumedByCharacter.set(characterId, true);
  syncFollowUpConsumedToStore(characterId);

  if (isForeground) {
    useChatSessionStore.getState().setTyping(true);
    useChatSessionStore.getState().setOutboundPhase('awaitingApi');
  }

  try {
    const resp = await runPaidAction(
      () =>
        chatWithCharacter({
          character_id: characterId,
          chat_scene: 1,
          messages: [{ msg_type: 'text', text: { text: FOLLOW_UP_PROMPT } }],
        }),
      {
        source: 'chat_with_character',
        onInsufficientBalance: () => {
          if (!isActiveChatSession(characterId)) return;
          const store = useChatSessionStore.getState();
          if (store.outboundPhase === 'awaitingApi') {
            store.setTyping(false);
            store.setOutboundPhase('idle');
          }
        },
      },
    );

    if (resp === null) return;
    if (!isActiveChatSession(characterId)) return;

    const store = useChatSessionStore.getState();
    if (store.outboundPhase !== 'awaitingApi') return;

    store.setCharacterStatus(resp.character_status);

    if (resp.character_messages.length > 0) {
      deliverCharacterRepliesImmediately(characterId, resp.character_messages);
    } else {
      store.setTyping(false);
      store.setOutboundPhase('idle');
    }
  } catch {
    if (isActiveChatSession(characterId)) {
      const store = useChatSessionStore.getState();
      if (store.outboundPhase === 'awaitingApi') {
        store.setTyping(false);
        store.setOutboundPhase('idle');
      }
    } else {
      consumedByCharacter.set(characterId, false);
    }
  } finally {
    firingByCharacter.delete(characterId);
  }
}

export function scheduleFollowUp(characterId: string) {
  clearTimer(characterId);

  if (consumedByCharacter.get(characterId)) return;

  const timerId = setTimeout(() => {
    void fireFollowUp(characterId);
  }, randomFollowUpDelayMs());
  timerByCharacter.set(characterId, timerId);
}

export function cancelFollowUp(characterId: string) {
  clearTimer(characterId);
}

export function resetFollowUpConsumed(characterId: string) {
  consumedByCharacter.set(characterId, false);
  syncFollowUpConsumedToStore(characterId);
}

export function restoreFollowUpConsumed(characterId: string) {
  syncFollowUpConsumedToStore(characterId);
}

export function ensureFollowUpPhaseWatcher() {
  if (phaseWatcherReady) return;
  phaseWatcherReady = true;

  let prevPhase = useChatSessionStore.getState().outboundPhase;
  let prevCharacterId = useChatSessionStore.getState().characterId;

  useChatSessionStore.subscribe(state => {
    const next = state.outboundPhase;
    const characterId = state.characterId;

    if (prevPhase !== next) {
      // 仅当「同一角色」完成播放后进入 idle，才启动 follow-up（避免切换角色时误触发）
      if (
        prevPhase === 'playingReply' &&
        next === 'idle' &&
        characterId &&
        characterId === prevCharacterId
      ) {
        scheduleFollowUp(characterId);
      }

      if (next !== 'idle' && characterId) {
        cancelFollowUp(characterId);
      }

      prevPhase = next;
    }

    if (characterId !== prevCharacterId) {
      prevCharacterId = characterId;
    }
  });
}
