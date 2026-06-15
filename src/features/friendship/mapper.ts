import {
  formatPhoneMessagePreview,
  pickLatestPhoneMessage,
} from '@/features/chat/lib/phone-message-adapter';
import type { FriendshipBasicInfo, ListFriendshipResp } from '@/generated';

import type {
  CharacterListItem,
  MessageConversation,
  MessageScene,
} from '@/pages/home/messages/types';

/** Unix 秒/毫秒混用时统一为毫秒（与 story-viewer-mapper 一致） */
function toEpochMs(timestamp?: number): number | undefined {
  if (!timestamp) return undefined;
  return timestamp > 1e12 ? timestamp : timestamp * 1000;
}

function formatConversationTime(timestamp?: number): string {
  const lastActiveAtMs = toEpochMs(timestamp);
  if (!lastActiveAtMs) return '';

  const date = new Date(lastActiveAtMs);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export function mapFriendshipToCharacterListItem(friend: FriendshipBasicInfo): CharacterListItem {
  return {
    id: friend.character_id,
    name: friend.name ?? friend.aka ?? '',
    avatar: friend.avatar?.url ?? '',
    pinned: (friend.pinned_at ?? 0) > 0,
    unread: (friend.unread_count ?? 0) > 0,
  };
}

export function mapFriendshipToConversation(friend: FriendshipBasicInfo): MessageConversation {
  const latestMessage = pickLatestPhoneMessage(friend.latest_messages);

  return {
    id: friend.character_id,
    name: friend.name ?? friend.aka ?? '',
    avatar: friend.avatar?.url ?? '',
    preview: latestMessage ? formatPhoneMessagePreview(latestMessage) : '',
    time: formatConversationTime(friend.last_active_at),
    unread: (friend.unread_count ?? 0) > 0,
  };
}

export function mapFriendshipList(resp: ListFriendshipResp): CharacterListItem[] {
  return resp.friends.map(mapFriendshipToCharacterListItem);
}

export function mapFriendshipConversations(resp: ListFriendshipResp): MessageConversation[] {
  return resp.friends.map(mapFriendshipToConversation);
}

/** 由好友列表生成场景横幅数据（大图右侧角色名、活跃态） */
export function mapFriendshipToMessageScene(friends: FriendshipBasicInfo[]): MessageScene {
  if (friends.length === 0) {
    return { tag: '· 消息', location: '', characters: [] };
  }

  const activeCharacterId = friends.reduce<string | undefined>((bestId, friend) => {
    if (!bestId) return friend.character_id;
    const best = friends.find(item => item.character_id === bestId);
    return (friend.last_active_at ?? 0) > (best?.last_active_at ?? 0)
      ? friend.character_id
      : bestId;
  }, undefined);

  return {
    tag: '· 消息',
    location: `${friends.length} 位角色`,
    characters: friends.slice(0, 6).map(friend => ({
      id: friend.character_id,
      name: friend.name ?? friend.aka ?? '',
      active: friend.character_id === activeCharacterId,
    })),
  };
}
