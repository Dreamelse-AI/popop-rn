import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra ?? {}

export const env = {
  apiBaseUrl: (extra.apiBaseUrl as string) ?? 'https://api.popop.com',
  apiSignSecret: (extra.apiSignSecret as string) ?? '',
  apiAppId: (extra.apiAppId as string) ?? 'popop_app',
  appOrigin: (extra.appOrigin as string) ?? 'https://app.popop.com',
}
