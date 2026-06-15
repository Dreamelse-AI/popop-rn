import { feedAssets } from '@/shared/assets/feed'

import type { MessageConversation, MessageScene } from './types'

export type { MessageConversation, MessageScene, MessageSceneCharacter } from './types'

export const MOCK_MESSAGE_SCENE: MessageScene = {
  tag: '=.=백일몽',
  location: '도심 한복판에 위치한 집',
  characters: [
    { id: 'c1', name: '션 싱휘' },
    { id: 'c2', name: '지우 지우', active: true },
    { id: 'c3', name: '루오시' },
    { id: 'c4', name: '에 칭치' },
  ],
}

export const MOCK_MESSAGE_CONVERSATIONS: MessageConversation[] = [
  {
    id: 'c1',
    name: '션 싱휘',
    avatar: '',
    preview: '정말 피곤하시겠어요.',
    time: '12:30',
    unread: true,
  },
  {
    id: 'c2',
    name: '지우 지우',
    avatar: '',
    preview: '[그림]',
    time: '12:30',
  },
  {
    id: 'c3',
    name: '바이 루오시',
    avatar: '',
    preview: '[목소리] 20"',
    time: '12:30',
    unread: true,
  },
  {
    id: 'c4',
    name: '시에 칭치',
    avatar: '',
    preview: '그는 언제나 정시에 발코니에 나타나, 온 힘을 다해 풍속과 햇빛을 꼼꼼하게 측정했다...',
    time: '12:30',
    unread: true,
  },
]
