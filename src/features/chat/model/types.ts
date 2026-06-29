export type ChatMessage =
  | { id: string; type: 'timestamp'; text: string; at: number }
  | { id: string; type: 'system'; text: string; at: number }
  | {
      id: string;
      type: 'text';
      sender: 'user' | 'character';
      text: string;
      at: number;
      serverMessageId?: string;
      cursor?: string;
      status?: 'pending' | 'failed';
    }
  | {
      id: string;
      type: 'emoji';
      sender: 'user' | 'character';
      emojiId: string;
      url: string;
      description: string;
      at: number;
      serverMessageId?: string;
      cursor?: string;
      status?: 'pending' | 'failed';
    }
  | {
      id: string;
      type: 'image';
      sender: 'user' | 'character';
      url: string;
      at: number;
      serverMessageId?: string;
      cursor?: string;
      status?: 'pending' | 'failed';
    }
  | {
      id: string;
      type: 'voice';
      sender: 'user' | 'character';
      durationSec: number;
      voiceUrl?: string;
      transcript?: string;
      unread?: boolean;
      transcriptRevealed?: boolean;
      at: number;
      serverMessageId?: string;
      cursor?: string;
      status?: 'pending' | 'failed';
    }
  | {
      id: string;
      type: 'share_card';
      sender: 'user' | 'character';
      authorName: string;
      authorAvatar: string;
      authorVerified?: boolean;
      content: string;
      imageUrl?: string;
      sourceType: 'story' | 'post';
      sourceId: string;
      at: number;
      serverMessageId?: string;
      cursor?: string;
      status?: 'pending' | 'failed';
    }
  | {
      id: string;
      type: 'link_card';
      sender: 'user' | 'character';
      title: string;
      description: string;
      url: string;
      unread?: boolean;
      clicked?: boolean;
      at: number;
      serverMessageId?: string;
      cursor?: string;
      status?: 'pending' | 'failed';
    };

export type OutboundPhase = 'idle' | 'queuing' | 'awaitingApi' | 'playingReply';

export type ChatCharacter = {
  id: string;
  name: string;
  avatar: string;
  sceneTag: string;
};
