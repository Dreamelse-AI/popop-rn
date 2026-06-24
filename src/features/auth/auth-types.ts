import type { LoginResp } from '@/generated/arca_apiComponents';

/** 已知的、有特殊本地化处理的账户地区 */
export type KnownAccountRegion = 'JP' | 'KR' | 'TW' | 'HK' | 'US' | 'GB' | 'CN' | 'OTHER';

/**
 * 账户地区；ISO 3166-1 alpha-2 大写字符串。
 * 已知地区用 KnownAccountRegion 枚举；未映射国家（如 SG、AU）以原始 ISO 码透传。
 */
export type AccountRegion = KnownAccountRegion | string;

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
