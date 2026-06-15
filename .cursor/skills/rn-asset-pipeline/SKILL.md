---
name: rn-asset-pipeline
description: Use when migrating icons, static images, remote images, or TOS uploads from popop H5 to popop-rn.
---

# RN 资产管道

## 决策树

```
资源类型？
├── .svg 图标 → import Icon from './x.svg' + PopIcon
├── .png/.webp 静态 → require() + PopImage source=
├── http(s) URL → PopImage uri= + normalizeAssetUrl
└── 内联品牌 SVG → 手写 react-native-svg 组件

涉及上传？
├── 是 → expo-image-picker + tos-upload（禁止 UI 层写签名）
└── 否 → 跳过
```

## 组件 API

```tsx
import IconClose from '@/shared/assets/.../close.svg';
import { PopIcon, PopImage } from '@/shared/ui';

<PopIcon icon={IconClose} size={24} color="#000" />
<PopImage uri={character.image} contentFit="cover" recyclingKey={id} style={...} />
```

## 禁止

- 禁止 RN `Image` 加载网络 URL（用 `PopImage`/`expo-image`）
- 禁止 SVG 当 URI 传给 Image
- 禁止批量 PNG 化 SVG
- 禁止保留 H5 的 `TOS_PROXY_PREFIX`

## 目录

- 业务资源：`src/shared/assets/`
- Expo icon/splash：`assets/`（根目录）
- Metro：`metro.config.js`（svg-transformer 已配置）

## FE 同步

FE 新增资源按映射 copy 到 `src/shared/assets/`，规范化含空格/中文的文件名。
