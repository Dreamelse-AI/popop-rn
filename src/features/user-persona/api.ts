import {
  applyUserPersona,
  createUserPersona,
  listUserPersonas,
  updateUserPersona,
  type ApplyUserPersonaReq,
  type CreateUserPersonaReq,
  type UpdateUserPersonaReq,
} from '@/generated';

export const userPersonaApi = {
  list: () => listUserPersonas(),
  create: (req: CreateUserPersonaReq) => createUserPersona(req),
  update: (req: UpdateUserPersonaReq) => updateUserPersona(req),
  apply: (req: ApplyUserPersonaReq) => applyUserPersona(req),
};
