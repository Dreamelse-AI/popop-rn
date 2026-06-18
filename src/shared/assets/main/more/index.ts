// 推荐-更多页素材统一导出
import { cdnImage } from '@/shared/lib/cdn';
import iconBack from './back.svg';
import iconContent from './content.svg';
const cardImage0 = cdnImage('assets/main/more/Frame 2117132555.png');
const cardImage1 = cdnImage('assets/main/more/Frame 2117132555-1.png');
const cardImage2 = cdnImage('assets/main/more/Frame 2117132555-2.png');
const cardImage3 = cdnImage('assets/main/more/Frame 2117132555-3.png');
export const recommendedMoreAssets = {
  iconBack,
  iconContent,
  cardImage0,
  cardImage1,
  cardImage2,
  cardImage3,
};

export type RecommendedMoreItem = {
  id: string;
  characterId: string;
  image: string;
  name: string;
  tags: string;
  chatCount: string;
  height: number;
  /** 对话气泡是否带 backdrop-blur（Figma 部分卡片样式） */
  badgeBlur?: boolean;
};

/** 双列瀑布流 mock 数据（与 Figma 217:9255 布局一致） */
export const RECOMMENDED_MORE_ROWS: RecommendedMoreItem[][] = [
  [
    {
      id: '1',
      characterId: 'c1',
      image: cardImage0,
      name: '션 싱휘',
      tags: '#연하남  #귀여움  #소유욕',
      chatCount: '121.1K',
      height: 328,
    },
    {
      id: '2',
      characterId: 'c1',
      image: cardImage1,
      name: '션 싱휘',
      tags: '#연하남  #귀여움  #소유욕',
      chatCount: '121.1K',
      height: 328,
      badgeBlur: true,
    },
  ],
  [
    {
      id: '3',
      characterId: 'c1',
      image: cardImage2,
      name: '션 싱휘',
      tags: '#연하남  #귀여움  #소유욕',
      chatCount: '121.1K',
      height: 344,
    },
    {
      id: '4',
      characterId: 'c1',
      image: cardImage3,
      name: '션 싱휘',
      tags: '#연하남  #귀여움  #소유욕',
      chatCount: '121.1K',
      height: 344,
    },
  ],
  [
    {
      id: '5',
      characterId: 'c1',
      image: cardImage0,
      name: '션 싱휘',
      tags: '#연하남  #귀여움  #소유욕',
      chatCount: '121.1K',
      height: 328,
    },
    {
      id: '6',
      characterId: 'c1',
      image: cardImage1,
      name: '션 싱휘',
      tags: '#연하남  #귀여움  #소유욕',
      chatCount: '121.1K',
      height: 328,
    },
  ],
];
