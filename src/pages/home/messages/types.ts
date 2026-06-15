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
