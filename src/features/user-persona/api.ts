import {
  applyUserPersona,
  createUserPersona,
  deleteUserPersona,
  listUserPersonas,
  updateUserPersona,
  type ApplyUserPersonaReq,
  type CreateUserPersonaReq,
  type DeleteUserPersonaReq,
  type UpdateUserPersonaReq,
} from '@/generated';

export const userPersonaApi = {
  list: () => listUserPersonas({}),
  create: (req: CreateUserPersonaReq) => createUserPersona(req),
  update: (req: UpdateUserPersonaReq) => updateUserPersona(req),
  delete: (req: DeleteUserPersonaReq) => deleteUserPersona(req),
  apply: (req: ApplyUserPersonaReq) => applyUserPersona(req),
};
