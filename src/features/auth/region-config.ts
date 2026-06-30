import type { AccountRegion, AgreementKey, AuthProvider, KnownAccountRegion } from './auth-types';
import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';
import { env } from '@/shared/env';

/** region 无法从 IP / 设备解析时的最终回退（美国英语） */
export const DEFAULT_ACCOUNT_REGION: AccountRegion = 'US';

export const ACCOUNT_REGION_STORAGE_KEY = 'popop-account-region';

const KNOWN_REGIONS: KnownAccountRegion[] = ['JP', 'KR', 'TW', 'HK', 'US', 'GB', 'CN', 'OTHER'];

export function isKnownAccountRegion(value: string): value is KnownAccountRegion {
  return (KNOWN_REGIONS as string[]).includes(value);
}

export function isAccountRegion(value: string): value is AccountRegion {
  return isKnownAccountRegion(value);
}

export const REGION_TO_LANGUAGE: Record<KnownAccountRegion, string> = {
  KR: 'ko',
  JP: 'ja',
  TW: 'zh',
  HK: 'zh',
  CN: 'zh',
  US: 'en',
  GB: 'en',
  OTHER: 'en',
};

export function getLanguageForRegion(region: AccountRegion): string {
  return REGION_TO_LANGUAGE[region as KnownAccountRegion] ?? 'en';
}

export function getRegionFromLanguage(language: string): AccountRegion {
  const normalized = language.trim().toLowerCase().split('-')[0];
  if (normalized === 'ko') return 'KR';
  if (normalized === 'ja') return 'JP';
  if (normalized === 'zh') return 'TW';
  if (normalized === 'en') return 'US';
  return DEFAULT_ACCOUNT_REGION;
}

/**
 * ISO 3166-1 alpha-2 → 账户地区。
 * 已知国家码直接返回对应 KnownAccountRegion；未知国家码返回原始大写 ISO 码透传。
 */
export function mapCountryCodeToAccountRegion(iso: string): AccountRegion {
  const code = iso.trim().toUpperCase();
  if (code === 'JP') return 'JP';
  if (code === 'KR') return 'KR';
  if (code === 'TW') return 'TW';
  if (code === 'HK' || code === 'MO') return 'HK';
  if (code === 'CN') return 'CN';
  if (code === 'US') return 'US';
  if (code === 'GB' || code === 'UK') return 'GB';
  return code;
}

/**
 * 解析 MOCK_DEVICE_REGION。
 * 支持：JP/KR/US/GB/UK/TW/HK/CN/OTHER 及别名 KO/EN，
 * 以及任意 ISO 国家码（如 SG、AU）→ 透传原始大写值。
 */
export function parseMockAccountRegion(value: string): AccountRegion | null {
  const code = value.trim().toUpperCase();
  if (!code || code === 'OFF' || code === 'FALSE') return null;
  if (code === 'KO') return 'KR';
  if (code === 'EN') return 'US';
  if (code === 'UK') return 'GB';
  if (code === 'MO') return 'HK';
  if (/^[A-Z]{2,3}$/.test(code)) return code;
  return getRegionFromLanguage(value);
}

/** 开发环境 mock 地区；env 未配置时不覆盖，配置为空时默认 US */
export function getMockAccountRegion(): AccountRegion | null {
  const raw = env.mockDeviceRegion;
  if (raw === undefined) return null;
  const value = raw.trim() || 'us';
  return parseMockAccountRegion(value);
}

function getDeviceLocaleTags(): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  const add = (tag: string | undefined) => {
    if (!tag || seen.has(tag)) return;
    seen.add(tag);
    tags.push(tag);
  };

  for (const locale of getLocales()) {
    add(locale.languageTag ?? undefined);
    if (locale.languageCode) {
      add(
        locale.regionCode
          ? `${locale.languageCode}-${locale.regionCode}`
          : locale.languageCode,
      );
    }
  }

  return tags;
}

function readCountryCodeFromTag(tag: string): string | null {
  try {
    const locale = new Intl.Locale(tag);
    if (locale.region) return locale.region;
  } catch {
    const region = tag.split('-')[1];
    if (region) return region.toUpperCase();
  }
  return null;
}

/**
 * 设备地区兜底：优先解析 locale 中的国家码，若无有效业务地区则按语言推断，最后回退 US（en）。
 */
export function getDeviceAccountRegion(): AccountRegion {
  const tags = getDeviceLocaleTags();

  for (const tag of tags) {
    const code = readCountryCodeFromTag(tag);
    if (code) {
      const region = mapCountryCodeToAccountRegion(code);
      if (region !== DEFAULT_ACCOUNT_REGION) {
        return region;
      }
    }
  }

  for (const tag of tags) {
    const region = getRegionFromLanguage(tag);
    if (region !== DEFAULT_ACCOUNT_REGION) {
      return region;
    }
  }

  return DEFAULT_ACCOUNT_REGION;
}

/** 登录页语言选择器选项（Figma：KO / JP / EN / CN） */
export type LanguageOption = {
  language: string;
  code: string;
};

export const SELECTABLE_LANGUAGE_OPTIONS: LanguageOption[] = [
  { language: 'ko', code: 'KO' },
  { language: 'ja', code: 'JP' },
  { language: 'zh', code: 'CN' },
  { language: 'en', code: 'EN' },
];

export function getLanguageOption(language: string): LanguageOption {
  const normalized = language.split('-')[0];
  return (
    SELECTABLE_LANGUAGE_OPTIONS.find(option => option.language === normalized)
    ?? SELECTABLE_LANGUAGE_OPTIONS.find(option => option.language === 'en')!
  );
}

/** 登录页地区选择器选项（Figma：KO / JP / EN / CN） */
export type RegionOption = {
  region: AccountRegion;
  code: string;
  flag: string;
};

export const SELECTABLE_REGION_OPTIONS: RegionOption[] = [
  { region: 'KR', code: 'KO', flag: '🇰🇷' },
  { region: 'JP', code: 'JP', flag: '🇯🇵' },
  { region: 'TW', code: 'CN', flag: '🇨🇳' },
  { region: 'US', code: 'EN', flag: '🇺🇸' },
];

const REGION_OPTION_FALLBACK: Partial<Record<KnownAccountRegion, KnownAccountRegion>> = {
  HK: 'TW',
  CN: 'TW',
  GB: 'US',
  OTHER: 'US',
};

export function getRegionOption(region: AccountRegion): RegionOption {
  const lookup = REGION_OPTION_FALLBACK[region as KnownAccountRegion] ?? region;
  return (
    SELECTABLE_REGION_OPTIONS.find(option => option.region === lookup)
    ?? SELECTABLE_REGION_OPTIONS.find(option => option.region === 'US')!
  );
}

const ENGLISH_LOGIN_METHODS: AuthProvider[] = ['apple', 'google', 'email'];
const CHINESE_LOGIN_METHODS: AuthProvider[] = ['apple', 'google', 'email'];

const LOGIN_METHODS_BY_KNOWN_REGION: Record<KnownAccountRegion, AuthProvider[]> = {
  TW: CHINESE_LOGIN_METHODS,
  HK: CHINESE_LOGIN_METHODS,
  CN: CHINESE_LOGIN_METHODS,
  JP: ['apple', 'google', 'email', 'line'],
  KR: ['apple', 'google', 'email', 'kakao'],
  US: ENGLISH_LOGIN_METHODS,
  GB: ENGLISH_LOGIN_METHODS,
  OTHER: ENGLISH_LOGIN_METHODS,
};

export const LOGIN_METHODS_BY_REGION = LOGIN_METHODS_BY_KNOWN_REGION;

const AGREEMENTS_BY_KNOWN_REGION: Record<KnownAccountRegion, AgreementKey[]> = {
  TW: ['terms', 'privacy'],
  HK: ['terms', 'privacy'],
  CN: ['terms', 'privacy'],
  JP: ['terms', 'privacy'],
  KR: ['ageOver14', 'terms', 'privacy', 'personalInfoConsent'],
  US: ['terms', 'privacy'],
  GB: ['terms', 'privacy'],
  OTHER: ['terms', 'privacy'],
};

export const AGREEMENTS_BY_REGION = AGREEMENTS_BY_KNOWN_REGION;

export const AGREEMENT_LABELS: Record<AgreementKey, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  personalInfoConsent: 'Personal Information Collection Consent',
  ageOver14: 'I am at least 14 years old',
};

const AGREEMENT_LABELS_KR: Record<AgreementKey, string> = {
  terms: '服务条款',
  privacy: '隐私政策',
  personalInfoConsent: '个人信息的收集和使用',
  ageOver14: '您必须年满14周岁。',
};

const AGREE_MODAL_TITLES: Record<KnownAccountRegion, string> = {
  TW: 'Please agree to the account terms',
  HK: 'Please agree to the account terms',
  CN: 'Please agree to the account terms',
  JP: 'Please agree to the account terms',
  KR: '계정 이용약관에 동의해 주세요',
  US: 'Please agree to the account terms',
  GB: 'Please agree to the account terms',
  OTHER: 'Please agree to the account terms',
};

const MARKETING_CONSENT_LABELS: Record<KnownAccountRegion, string> = {
  TW: 'Consent to receive event and benefit information',
  HK: 'Consent to receive event and benefit information',
  CN: 'Consent to receive event and benefit information',
  JP: 'Consent to receive event and benefit information',
  KR: '同意接收和使用活动及福利信息',
  US: 'Consent to receive event and benefit information',
  GB: 'Consent to receive event and benefit information',
  OTHER: 'Consent to receive event and benefit information',
};

const AGREE_MODAL_CONFIRM_LABELS: Record<KnownAccountRegion, { email: string; provider: string }> = {
  TW: { email: 'Sign In', provider: 'Continue' },
  HK: { email: 'Sign In', provider: 'Continue' },
  CN: { email: 'Sign In', provider: 'Continue' },
  JP: { email: 'Sign In', provider: 'Continue' },
  KR: { email: '로그인', provider: '로그인' },
  US: { email: 'Sign In', provider: 'Continue' },
  GB: { email: 'Sign In', provider: 'Continue' },
  OTHER: { email: 'Sign In', provider: 'Continue' },
};

const REGIONS_WITH_MARKETING_CONSENT: KnownAccountRegion[] = ['KR'];

export const AGREEMENT_LINKS: Partial<Record<AgreementKey, string>> = {
  terms: '/terms',
  privacy: '/privacy',
  personalInfoConsent: '/personal-info-consent',
};

export const PROVIDER_LABELS: Record<AuthProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  email: 'Email',
  line: 'LINE',
  kakao: 'KakaoTalk',
};

export function getLoginMethodsByRegion(region: AccountRegion) {
  return LOGIN_METHODS_BY_KNOWN_REGION[region as KnownAccountRegion] ?? ENGLISH_LOGIN_METHODS;
}

export function getAgreementsByRegion(region: AccountRegion) {
  return AGREEMENTS_BY_KNOWN_REGION[region as KnownAccountRegion] ?? AGREEMENTS_BY_KNOWN_REGION.US;
}

export function getAgreeModalTitle(region: AccountRegion) {
  return AGREE_MODAL_TITLES[region as KnownAccountRegion] ?? AGREE_MODAL_TITLES.US;
}

export function getAgreementItemLabel(key: AgreementKey, region: AccountRegion) {
  if (region === 'KR') {
    return AGREEMENT_LABELS_KR[key];
  }
  return AGREEMENT_LABELS[key];
}

export function getMarketingConsentLabel(region: AccountRegion) {
  return MARKETING_CONSENT_LABELS[region as KnownAccountRegion] ?? MARKETING_CONSENT_LABELS.US;
}

export function hasMarketingConsent(region: AccountRegion) {
  return REGIONS_WITH_MARKETING_CONSENT.includes(region as KnownAccountRegion);
}

export function getAgreeModalConfirmText(region: AccountRegion, mode: 'email' | 'provider') {
  const labels = AGREE_MODAL_CONFIRM_LABELS[region as KnownAccountRegion] ?? AGREE_MODAL_CONFIRM_LABELS.US;
  return labels[mode];
}

type ProfileSetupCopy = {
  title: string;
  nameLabel: string;
  namePlaceholder: string;
  genderLabel: string;
  male: string;
  female: string;
  instructionsLabel: string;
  instructionsPlaceholder: string;
  hint: string;
  submit: string;
};

const PROFILE_SETUP_COPY_EN: ProfileSetupCopy = {
  title: 'My Chat Profile',
  nameLabel: 'Name',
  namePlaceholder: 'Enter character name',
  genderLabel: 'Gender',
  male: 'Male',
  female: 'Female',
  instructionsLabel: 'Custom Instructions',
  instructionsPlaceholder: 'Enter your settings...',
  hint: 'You can change this anytime in Character - Chat - Sidebar Settings.',
  submit: 'Go to Chat',
};

const PROFILE_SETUP_COPY: Partial<Record<KnownAccountRegion, ProfileSetupCopy>> = {
  TW: PROFILE_SETUP_COPY_EN,
  HK: PROFILE_SETUP_COPY_EN,
  CN: PROFILE_SETUP_COPY_EN,
  JP: PROFILE_SETUP_COPY_EN,
  US: PROFILE_SETUP_COPY_EN,
  GB: PROFILE_SETUP_COPY_EN,
  OTHER: PROFILE_SETUP_COPY_EN,
  KR: {
    title: '내 채팅 프로필',
    nameLabel: '이름',
    namePlaceholder: '캐릭터 이름을 입력하세요',
    genderLabel: '성별',
    male: '남성',
    female: '여성',
    instructionsLabel: '사용자 지정 지침',
    instructionsPlaceholder: '설정을 입력하세요...',
    hint: '"캐릭터 - 채팅 - 사이드바 설정"에서 언제든지 변경할 수 있습니다.',
    submit: '채팅하러 가세요',
  },
};

export function getProfileSetupCopy(region: AccountRegion) {
  return PROFILE_SETUP_COPY[region as KnownAccountRegion] ?? PROFILE_SETUP_COPY_EN;
}
