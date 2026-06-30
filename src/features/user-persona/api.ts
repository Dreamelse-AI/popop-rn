import {
  applyUserPersona,
  createUserPersona,
  deleteUserPersona,
  listUserPersonas,
  updateUserPersona,
  type CreateUserPersonaReq,
  type DeleteUserPersonaReq,
  type UpdateUserPersonaReq,
} from '@/generated';

/**
 * apply_persona 的后端入参已从 character_id 迁移为 character_save_id（见 popop-fe IDL）。
 * 但本仓库 external/common-idl submodule 尚未更新、且 goctl 未安装无法 gen:api，
 * 生成的 ApplyUserPersonaReq 仍是 character_id。这里用正确的形状直接传给后端，
 * 待 IDL 同步 + 重新生成后删除此本地类型与 cast。
 */
type ApplyUserPersonaReqV2 = {
  character_save_id: string;
  persona_id?: string;
};

export const userPersonaApi = {
  list: (req: { character_save_id?: string } = {}) =>
    listUserPersonas({ character_save_id: req.character_save_id }),
  create: (req: CreateUserPersonaReq) => createUserPersona(req),
  update: (req: UpdateUserPersonaReq) => updateUserPersona(req),
  delete: (req: DeleteUserPersonaReq) => deleteUserPersona(req),
  apply: (req: ApplyUserPersonaReqV2) =>
    applyUserPersona(req as unknown as Parameters<typeof applyUserPersona>[0]),
};
