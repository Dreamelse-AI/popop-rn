import {
  getCharacterDetail,
  listCopyableCharacters,
  type GetCharacterDetailReq,
  type GetCharacterDetailResp,
  type ListCopyableCharactersReq,
} from '@/generated';

/** 落地页 HTML 字段，待 IDL 同步后可移除扩展 */
export type GetCharacterDetailPageResp = GetCharacterDetailResp & {
  html_content?: string;
};

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
