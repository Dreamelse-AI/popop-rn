import {
  getCharacterDetail,
  listCopyableCharacters,
  type GetCharacterDetailReq,
  type GetCharacterDetailResp,
  type ListCopyableCharactersReq,
} from '@/generated';

/** 角色详情 API 响应（与 GetCharacterDetailResp 一致） */
export type GetCharacterDetailPageResp = GetCharacterDetailResp;

export const characterApi = {
  /** 拉取可复制角色（添加好友页数据源，后端做可见性筛选） */
  listCopyable: (
    limit = 30,
    keyword?: string,
    cursor?: string,
  ) => {
    const req: ListCopyableCharactersReq = {
      limit,
      ...(keyword ? { keyword } : {}),
      ...(cursor ? { cursor } : {}),
    };
    return listCopyableCharacters(req);
  },

  /** 角色落地页：POST /character/detail，参数走 body（character_id、source、impression_id） */
  getDetail: (req: GetCharacterDetailReq) =>
    getCharacterDetail(req) as Promise<GetCharacterDetailPageResp>,
};
