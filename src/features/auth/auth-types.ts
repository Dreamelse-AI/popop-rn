import type { LoginResp } from '@/generated/arca_apiComponents';

/** 账户地区；与 X-Region ISO 3166-1 对齐（OTHER 仅作兼容，API 走 US） */
export type AccountRegion = 'JP' | 'KR' | 'TW' | 'HK' | 'US' | 'GB' | 'CN' | 'OTHER';

export type AuthProvider = 'google' | 'apple' | 'email' | 'line' | 'kakao';

export type OAuthProvider = Exclude<AuthProvider, 'email'>;

export type AgreementKey = 'terms' | 'privacy' | 'personalInfoConsent' | 'ageOver14';

export type ProfileGender = 'male' | 'female' | 'other';

export type User = {
  id: string;
  email?: string;
  nickname: string;
  avatar: string;
};

/** 登录响应：IDL LoginResp + 后端可能扩展的字段（待 IDL 补齐后可收紧） */
export type AuthResponse = LoginResp & {
  new_user_reward_coins?: number;
};

export type AccountRegionResponse = {
  region: AccountRegion;
};
