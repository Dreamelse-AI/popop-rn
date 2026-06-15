---
name: rn-platform-adapters
description: Use when writing storage, auth, media, navigation, or payment code in popop-rn. Reference for H5 to RN API mapping.
---

# RN 平台对照表（popop-rn 实际实现）

| H5 (popop-fe) | RN (popop-rn) | 路径/备注 |
| --- | --- | --- |
| `localStorage` | MMKV + SecureStore | `src/shared/storage/` |
| React Router 7 | React Navigation 7 | `src/app/navigation.tsx` |
| Tailwind | StyleSheet + safe area | `useSafeAreaInsets` |
| bottom-sheet (DOM) | BottomSheet (Modal) | `src/shared/ui/bottom-sheet.tsx` |
| Google/Apple OAuth web | Google Sign-In + Apple Auth | `src/features/auth/hooks/` |
| `@stripe/react-stripe-js` | `@stripe/stripe-react-native` | `src/shared/wallet/stripe-provider.tsx` |
| vConsole | Reactotron | `src/shared/dev/reactotron.ts` |
| SVG as URL + `<img>` | svg-transformer + `PopIcon` | `metro.config.js` |
| `<img object-cover>` | `PopImage contentFit="cover"` | `src/shared/ui/pop-image.tsx` |
| TOS dev proxy | 直连 HTTPS | 无 `__tos_proxy__` |
| `resolveTosAssetUrl` | `normalizeAssetUrl` | `src/shared/lib/normalize-asset-url.ts` |
| `File` upload | expo-image-picker + fetch PUT | `src/features/chat/lib/tos-upload.ts` |
| Web Speech API | expo-speech-recognition | chat voice hooks |
| `KeyboardInset` hook | KeyboardAvoidingView | chat 输入栏 |

## 导航注册

新增 screen 必须更新 `src/app/navigation.tsx` 的 `RootStackParamList` 与 navigator。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `API_BASE_URL` | API 根地址 |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Payment Sheet |
