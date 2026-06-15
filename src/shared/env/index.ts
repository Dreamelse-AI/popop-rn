import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra ?? {}

export const env = {
  apiBaseUrl: (extra.apiBaseUrl as string) ?? 'https://api.popop.com',
  apiSignSecret: (extra.apiSignSecret as string) ?? '',
  apiAppId: (extra.apiAppId as string) ?? 'popop_app',
  appOrigin: (extra.appOrigin as string) ?? 'https://app.popop.com',
  /** 本地开发用登录 token，见 .env.example */
  devAuthToken: (extra.devAuthToken as string) ?? '',
}
