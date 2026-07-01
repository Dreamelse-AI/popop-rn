import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra ?? {}

export const env = {
  apiBaseUrl: (extra.apiBaseUrl as string) ?? 'https://api.popop.dev',
  apiSignSecret: (extra.apiSignSecret as string) ?? '',
  apiAppId: (extra.apiAppId as string) ?? 'popop_app',
  appOrigin: (extra.appOrigin as string) ?? 'https://test.popop.ai',
  appleAndroidClientId: (extra.appleAndroidClientId as string) ?? 'com.dreamelse.arca.web',
  /** 与 web 一致：${origin}/auth/apple/callback */
  appleAndroidRedirectUri: `${(extra.appOrigin as string) ?? 'https://test.popop.ai'}/auth/apple/callback`,
  /** 本地开发用登录 token，见 .env.example */
  devAuthToken: (extra.devAuthToken as string) ?? '',
  mockNewUser: extra.mockNewUser === true,
  /** 覆盖 ip_region / 设备地区（JP | KR | US | GB/UK | TW | HK | CN；默认 US；off 关闭），见 .env.example */
  mockDeviceRegion: extra.mockDeviceRegion as string | undefined,
  mockCharacterPostsFlag: (extra.mockCharacterPosts as string) ?? '',
  stripePublishableKey: (extra.stripePublishableKey as string) ?? '',
  characterCreationUseMock: extra.characterCreationUseMock === true,
  previewPublishSuccessModal: extra.previewPublishSuccessModal === true,
}
