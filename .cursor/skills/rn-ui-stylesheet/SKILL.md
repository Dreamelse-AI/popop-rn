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

## Bottom Sheet 弹窗

标准参考：`MusicPickerSheet` + `src/shared/ui/bottom-sheet.tsx`。

- **壳层**：一律用 `BottomSheet`，禁止手写 `Modal` 底部弹窗壳（特殊可变高度场景如 `PostDynamicImagePickerSheet` 可保留自定义壳，但视觉 token 须对齐 `SHEET`）
- **组合组件**：`SheetHeader` / `SheetBody` / `SheetListRow` / `SheetFooterButton` / `SheetEmpty` / `SheetLoading` / `SheetRetry`（`src/shared/ui/sheet-primitives.tsx`）
- **设计 token**：`SHEET` 常量（`src/shared/ui/sheet-tokens.ts`），圆角 30、遮罩 0.6、关闭 icon 28
- **关闭按钮**：默认 `SheetCloseIcon`，无需每个 sheet 重复配置
- **嵌套滚动**：含 `FlatList` 时设 `scrollable={false}`；固定高度内容用 `fitContent`

## 禁止

- 禁止复制 Tailwind class 字符串
- 禁止在 screen 散落 icon 尺寸魔法数（用 PopIcon size）
