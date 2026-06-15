// Auth API：契约来自 IDL，经 goctl 生成后在此做薄封装（Mock 地区等）
import {
  emailLogin,
  oauthLogin,
  sendEmailCode,
  type LoginResp,
  type OAuthSessionReq,
} from '@/generated';
import type { AccountRegionResponse, AuthResponse, OAuthProvider } from './auth-types';
import { PROVIDER_LABELS } from './region-config';
import { getAccountRegion, waitForAccountRegion } from '@/shared/api/account-region-store';
import { buildLocaleHeaders } from '@/shared/api/locale-headers';

type SendCodeParams = {
  email: string;
};

type VerifyCodeParams = {
  email: string;
  code: string;
};

type OAuthSessionParams = {
  idToken?: string;
  code?: string;
  nonce: string;
  redirectUri?: string;
};

function toOAuthBody(params: OAuthSessionParams): OAuthSessionReq {
  return {
    id_token: params.idToken,
    code: params.code,
    nonce: params.nonce,
    redirect_uri: params.redirectUri,
  };
}

export const authApi = {
  getAccountRegion: async (): Promise<AccountRegionResponse> => {
    await waitForAccountRegion();
    return { region: getAccountRegion() };
  },

  sendCode: (params: SendCodeParams) =>
    sendEmailCode({}, { email: params.email }, buildLocaleHeaders()),

  verifyCode: (params: VerifyCodeParams): Promise<AuthResponse> =>
    emailLogin({ email: params.email, code: params.code }),

  createOAuthSession: (provider: OAuthProvider, params: OAuthSessionParams): Promise<AuthResponse> =>
    oauthLogin({}, toOAuthBody(params), provider),

  loginWithProvider: async (provider: OAuthProvider): Promise<AuthResponse> => {
    throw new Error(`${PROVIDER_LABELS[provider]} login requires SDK integration to obtain id_token.`);
  },
};

export type { LoginResp };
