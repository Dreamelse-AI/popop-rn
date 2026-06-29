export type CharacterListItem = {
  id: string;
  name: string;
  avatar: string;
  pinned?: boolean;
  unread?: boolean;
};

export type MessageConversation = {
  id: string;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread?: boolean;
  /** latest_messages 中存在角色未读消息（用于置顶头像预览气泡展示判定） */
  hasUnreadMessage?: boolean;
};

export type MessageSceneCharacter = {
  id: string;
  name: string;
  active?: boolean;
};

export type MessageScene = {
  tag: string;
  location: string;
  characters: MessageSceneCharacter[];
};
