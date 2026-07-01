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
            'com.googleusercontent.apps.875163971501-17vv2c5589c9d4j7h2ml3icf48nqtk5b',
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
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    package: 'com.imagine.popop',
    softwareKeyboardLayoutMode: 'resize',
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#fbf2d8',
      },
    ],
    './plugins/with-android-network-security-config.js',
    './plugins/with-google-modular-headers.js',
    'expo-dev-client',
    'expo-apple-authentication',
    '@react-native-google-signin/google-signin',
    'expo-iap',
    [
      'expo-speech-recognition',
      {
        microphonePermission: 'Used to record voice messages',
        speechRecognitionPermission: 'Used to transcribe voice messages',
      },
    ],
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
          buildArchs: ['arm64-v8a'],
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '7c4a5581-8a44-4d7f-b66b-9bd954d9b38a',
    },
    apiBaseUrl: process.env.API_BASE_URL ?? 'https://api.popop.dev',
    /** 与 web 端 window.location.origin 对应，用于拼 Apple Android redirect_uri */
    appOrigin: process.env.APP_ORIGIN ?? 'https://test.popop.ai',
    appleAndroidClientId: process.env.APPLE_ANDROID_CLIENT_ID ?? 'com.dreamelse.arca.web',
    apiSignSecret: process.env.API_SIGN_SECRET ?? 'sk-ios-bG9jYWxfc2VjcmV0X2tleQ',
    apiAppId: process.env.API_APP_ID ?? 'belike_ios',
    devAuthToken: process.env.DEV_AUTH_TOKEN ?? '',
    mockNewUser: process.env.MOCK_NEW_USER === 'true',
    mockDeviceRegion: process.env.MOCK_DEVICE_REGION,
    mockCharacterPosts: process.env.MOCK_CHARACTER_POSTS ?? '',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
    characterCreationUseMock: process.env.CHARACTER_CREATION_USE_MOCK === 'true',
    previewPublishSuccessModal: process.env.PREVIEW_PUBLISH_SUCCESS_MODAL === 'true',
  },
})
