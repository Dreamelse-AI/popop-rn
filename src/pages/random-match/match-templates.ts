import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';
import { cdnImage } from '@/shared/lib/cdn';
const cardHeartbeat = { uri: cdnImage('assets/random-match/card-heartbeat.png') };
import cardEmoDrop from '@/shared/assets/random-match/emo-drop.svg';

export type MatchTemplate = 'default' | 'heartbeat' | 'emo' | 'shy';

export type TemplateStyle = {
  bgColor: string;
  textColor: string;
  tagColor: string;
  emojiColor: string;
  overlayImage: number | { uri: string } | FC<SvgProps> | null;
  /** 'cover' = 铺满卡片; 'decor' = 装饰性元素，右侧居中 */
  overlayMode: 'cover' | 'decor';
  emojiLabel: string;
};

export const MATCH_TEMPLATES: Record<MatchTemplate, TemplateStyle> = {
  default: {
    bgColor: '#d7f0ff',
    textColor: 'rgba(0,0,0,0.9)',
    tagColor: '#1d8ed4',
    emojiColor: '#7abfe9',
    overlayImage: null,
    overlayMode: 'cover',
    emojiLabel: '',
  },
  heartbeat: {
    bgColor: '#ffd7e6',
    textColor: 'rgba(0,0,0,0.9)',
    tagColor: '#d64a82',
    emojiColor: '#e98ab3',
    overlayImage: cardHeartbeat,
    overlayMode: 'cover',
    emojiLabel: '(๑•ᴗ•๑)♡',
  },
  emo: {
    bgColor: '#d7f0ff',
    textColor: 'rgba(0,0,0,0.9)',
    tagColor: '#1d8ed4',
    emojiColor: '#7abfe9',
    overlayImage: cardEmoDrop,
    overlayMode: 'decor',
    emojiLabel: '(っ◞‸◟c)',
  },
  shy: {
    bgColor: '#d7f0ff',
    textColor: 'rgba(0,0,0,0.9)',
    tagColor: '#1d8ed4',
    emojiColor: '#7abfe9',
    overlayImage: null,
    overlayMode: 'cover',
    emojiLabel: '(//▽//)',
  },
};
