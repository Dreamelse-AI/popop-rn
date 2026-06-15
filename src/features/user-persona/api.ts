import {
  applyUserPersona,
  listUserPersonas,
  updateUserPersona,
  type ApplyUserPersonaReq,
  type CreateUserPersonaReq,
  type CreateUserPersonaResp,
  type UpdateUserPersonaReq,
} from '@/generated';

import { apiClient, ApiError } from '@/shared/api/api-client';

/** 测试用：create 直连生产，不走本地 /api 代理 */
const CREATE_USER_PERSONA_DIRECT_URL = 'https://i18n-api.imaginewithu.com/user_persona/create';

async function createUserPersonaDirect(req: CreateUserPersonaReq): Promise<CreateUserPersonaResp> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = apiClient.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(CREATE_USER_PERSONA_DIRECT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
  });

  const json = (await res.json().catch(() => null)) as {
    code: number;
    msg: string;
    data: CreateUserPersonaResp | null;
  } | null;

  if (!res.ok) {
    throw new ApiError(res.status, json?.msg ?? res.statusText);
  }
  if (!json) {
    throw new ApiError(res.status, 'Empty response');
  }
  if (json.code !== 0) {
    throw new ApiError(json.code, json.msg || 'Request failed');
  }

  return json.data as CreateUserPersonaResp;
}

export const userPersonaApi = {
  list: () => listUserPersonas(),
  create: (req: CreateUserPersonaReq) => createUserPersonaDirect(req),
  update: (req: UpdateUserPersonaReq) => updateUserPersona(req),
  apply: (req: ApplyUserPersonaReq) => applyUserPersona(req),
};
