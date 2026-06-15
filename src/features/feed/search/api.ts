/**
 * Feed 搜索 API — POST /feed/popop_search
 */
import { feedPopopSearch, type FeedPopopSearchReq } from '@/generated';
import type { FeedSearchType } from './types';

export const feedSearchApi = {
  search: (keyword: string, type: FeedSearchType, limit = 20, cursor?: string) => {
    const req: FeedPopopSearchReq = {
      type,
      keyword,
      limit,
      ...(cursor ? { cursor } : {}),
    };
    return feedPopopSearch(req);
  },

  /** 初始态发现网格：不传 keyword，由后端返回默认搜索发现内容 */
  discover: (limit = 21, cursor?: string) => {
    const req: FeedPopopSearchReq = {
      limit,
      ...(cursor ? { cursor } : {}),
    };
    return feedPopopSearch(req);
  },
};
