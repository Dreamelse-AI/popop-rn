---
name: rn-ui-stylesheet
description: Use when writing RN screens or components in popop-rn. StyleSheet conventions, not Tailwind port.
---

# RN UI / StyleSheet 规范

## 目录结构

- 页面：`src/pages/<feature>/`
- 业务 UI：`src/features/<name>/ui/`
- 共享组件：`src/shared/ui/`
- **不是** Expo Router 的 `app/(tabs)/`

## 屏幕模板

- SafeArea：`useSafeAreaInsets()` 或 `SafeAreaProvider`
- 三态：loading / error / empty
- 导航：改 screen 时同步 `src/app/navigation.tsx`

## 布局对照

| H5 Tailwind | RN |
| --- | --- |
| `object-cover` | `PopImage contentFit="cover"` |
| `absolute inset-0 size-full` | `StyleSheet.absoluteFillObject` |
| `h-dvh` | `flex: 1` + safe area |
| 390px 固定宽 | flex + `maxWidth` |

## 列表

Feed/Chat 长列表优先 `@shopify/flash-list`（若已引入）或优化 FlatList；避免无 key 重渲染。

## 图片与图标

- 网络/本地图：`PopImage`（禁止裸 RN Image + uri）
- SVG 图标：`PopIcon` + transformer

## 禁止

- 禁止复制 Tailwind class 字符串
- 禁止在 screen 散落 icon 尺寸魔法数（用 PopIcon size）
