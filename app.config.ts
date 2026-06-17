import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Popop',
  slug: 'popop',
  owner: 'imaginewithu',
  scheme: 'popop',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.imagine.popop',
    usesAppleSignIn: true,
    appleTeamId: 'RXP5R6L784',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: 'Used to take photos for your profile and chats',
      NSMicrophoneUsageDescription: 'Used to record voice messages',
      NSPhotoLibraryUsageDescription: 'Used to select photos from your library',
      NSSpeechRecognitionUsageDescription: 'Used to transcribe voice messages',
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: [
            'com.googleusercontent.apps.875163971501-eg6ltniot9voha7laehf4q9nv1c64b06',
            'popop',
          ],
        },
      ],
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSAllowsLocalNetworking: true,
      },
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#ffffff',
    },
    package: 'com.imagine.popop',
    softwareKeyboardLayoutMode: 'resize',
  },
  plugins: [
    'expo-dev-client',
    'expo-apple-authentication',
    '@react-native-google-signin/google-signin',
    'expo-iap',
    'expo-speech-recognition',
    'expo-audio',
    [
      'expo-image-picker',
      {
        photosPermission: 'Used to select photos for your profile and chats',
        cameraPermission: 'Used to take photos for your profile and chats',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Used to browse and select photos from your library',
        savePhotosPermission: 'Used to save photos to your library',
        isAccessMediaLocationEnabled: false,
      },
    ],
    [
      'expo-secure-store',
      {},
    ],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.4',
        },
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          kotlinVersion: '2.2.0',
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '7c4a5581-8a44-4d7f-b66b-9bd954d9b38a',
    },
    apiBaseUrl: process.env.API_BASE_URL ?? 'https://i18n-api.imaginewithu.com',
    apiSignSecret: process.env.API_SIGN_SECRET ?? 'sk-ios-bG9jYWxfc2VjcmV0X2tleQ',
    apiAppId: process.env.API_APP_ID ?? 'belike_ios',
    devAuthToken: process.env.DEV_AUTH_TOKEN ?? '',
  },
})
