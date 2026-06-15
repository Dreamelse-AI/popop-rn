import type { AccountRegion, AgreementKey, AuthProvider } from './auth-types';
import { getLocales } from 'expo-localization';

export const MOCK_ACCOUNT_REGION: AccountRegion = 'KR';

export const REGION_TO_LANGUAGE: Record<AccountRegion, string> = {
  KR: 'ko',
  JP: 'ja',
  TW: 'zh',
  OTHER: 'en',
};

export function getRegionFromLanguage(language: string): AccountRegion {
  const entry = Object.entries(REGION_TO_LANGUAGE).find(([, l]) => l === language);
  return (entry?.[0] as AccountRegion) || 'OTHER';
}

/** ISO 3166-1 alpha-2 国家/地区码 → 账户地区 */
export function mapCountryCodeToAccountRegion(iso: string): AccountRegion {
  const code = iso.trim().toUpperCase();
  if (code === 'JP') return 'JP';
  if (code === 'KR') return 'KR';
  if (code === 'CN' || code === 'TW' || code === 'HK' || code === 'MO') return 'TW';
  return 'OTHER';
}

function readDeviceCountryCode(): string | null {
  const locales = getLocales()
  for (const locale of locales) {
    if (locale.regionCode) return locale.regionCode
  }
  return null
}

/** 读取设备地区设置，无法解析时回退到 i18n 语言 */
export function getDeviceAccountRegion(): AccountRegion {
  const countryCode = readDeviceCountryCode();
  if (countryCode) {
    return mapCountryCodeToAccountRegion(countryCode);
  }
  const locales = getLocales()
  const lang = locales[0]?.languageCode ?? 'en'
  return getRegionFromLanguage(lang);
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
  { region: 'OTHER', code: 'EN', flag: '🇺🇸' },
];

export function getRegionOption(region: AccountRegion): RegionOption {
  return (
    SELECTABLE_REGION_OPTIONS.find(option => option.region === region)
    ?? SELECTABLE_REGION_OPTIONS.find(option => option.region === 'OTHER')!
  );
}

export const LOGIN_METHODS_BY_REGION: Record<AccountRegion, AuthProvider[]> = {
  TW: ['apple', 'google', 'email'],
  JP: ['apple', 'google', 'email', 'line'],
  KR: ['apple', 'google', 'email', 'kakao'],
  OTHER: ['apple', 'google', 'email'],
};

export const AGREEMENTS_BY_REGION: Record<AccountRegion, AgreementKey[]> = {
  TW: ['terms', 'privacy'],
  JP: ['terms', 'privacy'],
  KR: ['ageOver14', 'terms', 'privacy', 'personalInfoConsent'],
  OTHER: ['terms', 'privacy'],
};

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

const AGREE_MODAL_TITLES: Record<AccountRegion, string> = {
  TW: 'Please agree to the account terms',
  JP: 'Please agree to the account terms',
  KR: '계정 이용약관에 동의해 주세요',
  OTHER: 'Please agree to the account terms',
};

const MARKETING_CONSENT_LABELS: Record<AccountRegion, string> = {
  TW: 'Consent to receive event and benefit information',
  JP: 'Consent to receive event and benefit information',
  KR: '同意接收和使用活动及福利信息',
  OTHER: 'Consent to receive event and benefit information',
};

const AGREE_MODAL_CONFIRM_LABELS: Record<AccountRegion, { email: string; provider: string }> = {
  TW: { email: 'Sign In', provider: 'Continue' },
  JP: { email: 'Sign In', provider: 'Continue' },
  KR: { email: '로그인', provider: '로그인' },
  OTHER: { email: 'Sign In', provider: 'Continue' },
};

const REGIONS_WITH_MARKETING_CONSENT: AccountRegion[] = ['KR'];

// AgreementKey 在 auth-types.ts 里是四种协议标识，比如：terms — 服务条款，privacy — 隐私政策
// Record<AgreementKey, string> 表示「每个 key 都对应一个 string URL」
// Partial<...> 表示不必每个 key 都有值——可以只配一部分
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
  return LOGIN_METHODS_BY_REGION[region] ?? LOGIN_METHODS_BY_REGION.OTHER;
}

export function getAgreementsByRegion(region: AccountRegion) {
  return AGREEMENTS_BY_REGION[region] ?? AGREEMENTS_BY_REGION.OTHER;
}

export function getAgreeModalTitle(region: AccountRegion) {
  return AGREE_MODAL_TITLES[region] ?? AGREE_MODAL_TITLES.OTHER;
}

export function getAgreementItemLabel(key: AgreementKey, region: AccountRegion) {
  if (region === 'KR') {
    return AGREEMENT_LABELS_KR[key];
  }
  return AGREEMENT_LABELS[key];
}

export function getMarketingConsentLabel(region: AccountRegion) {
  return MARKETING_CONSENT_LABELS[region] ?? MARKETING_CONSENT_LABELS.OTHER;
}

export function hasMarketingConsent(region: AccountRegion) {
  return REGIONS_WITH_MARKETING_CONSENT.includes(region);
}

export function getAgreeModalConfirmText(region: AccountRegion, mode: 'email' | 'provider') {
  const labels = AGREE_MODAL_CONFIRM_LABELS[region] ?? AGREE_MODAL_CONFIRM_LABELS.OTHER;
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

const PROFILE_SETUP_COPY: Record<AccountRegion, ProfileSetupCopy> = {
  TW: {
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
  },
  JP: {
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
  },
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
  OTHER: {
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
  },
};

export function getProfileSetupCopy(region: AccountRegion) {
  return PROFILE_SETUP_COPY[region] ?? PROFILE_SETUP_COPY.OTHER;
}
