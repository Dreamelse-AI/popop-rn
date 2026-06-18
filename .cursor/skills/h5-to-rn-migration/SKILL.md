---
name: h5-to-rn-migration
description: Use when migrating popop H5 to React Native, syncing popop-fe to popop-rn, or deciding what code to reuse.
---

# H5 → RN 迁移总控

## 双仓路径

| 仓库 | 路径 |
| --- | --- |
| FE (H5) | `/Users/allen/Fork/popop-fe` |
| RN | `/Users/allen/Fork/popop-rn` |

## 关键决策

- **同步模式**：文件级 copy + RN 改写（非 `@popop/*` workspace）
- **导航**：React Navigation 7（`src/app/navigation.tsx`），**不是** Expo Router
- **样式**：StyleSheet；资源在 `src/shared/assets/`
- **持久化**：MMKV + `expo-secure-store`（`src/shared/storage/`）
- **IDL**：`external/common-idl` submodule → `npm run gen:api` → `src/generated/`
- **主体已迁移**：auth、feed、chat、character-creation 等；工作重点为 **同步、收尾、规范**

## FE → RN 路径映射

| popop-fe | popop-rn |
| --- | --- |
| `packages/consumer/src/features/` | `src/features/` |
| `packages/shared/src/features/` | `src/features/` |
| `packages/shared/src/shared/` | `src/shared/` |
| `packages/shared/src/generated/` | `src/generated/` |
| `apps/mobile/src/pages/` | `src/pages/` |

## 构建命令

```bash
cd /Users/allen/Fork/popop-rn
npm install
git submodule update --init external/common-idl
npm run gen:api          # 或 npm run sync:generated-from-fe
npm run dev              # dev client (Metro 默认 8081)
npm run typecheck
npx expo prebuild --clean   # native 依赖变更后
eas build --profile development --platform ios
```

## 禁止事项

- 禁止假设仓库名 popop-native 或使用 Expo Router
- 禁止 RN import `@popop/consumer` / `@popop/shared`
- 禁止引入 `react-dom`、`react-router`、Tailwind、`localStorage`
- 禁止迁移 Web 专用下载引导、下载提示条、App 下载落地页入口；RN 已是客户端，不展示 Web 下载 CTA
- 禁止手改 `src/generated/`
- 禁止从 FE 整文件复制 `.tsx` 而不做 RN 改写
- 禁止跳过 Mock 开关联调未验证 API
- **禁止迁移 FE 埋点 SDK 及其上报逻辑**（见下）

## 埋点 / 数据统计：不迁移

从 popop-fe 同步或移植时，**埋点 SDK 相关代码一律不带到 RN**。RN 端数据统计将单独接入，迁移阶段不要为了 FE parity 补上报。

### 不迁移（遇到则跳过或删除）

- 第三方埋点 SDK 依赖、初始化（火山/神策/友盟/Firebase Analytics 等）
- SDK 封装调用：`track*`、`logEvent*`、`pageView*`、`sendEvent*` 等
- FE 专用于数据统计的上报 hooks / 工具（页面进出、行为事件、曝光点击统计等）
- 纯埋点用途的后端上报：`reportAppLog`、`reportAppState`（`page_enter` / `heartbeat` 等）、`feedItemReport` / `feed-report` / `useFeedItemExposure` 等曝光点击统计

### 仍迁移（业务逻辑，非埋点 SDK）

- 产品状态同步 API：消息已读、story `view/mark`、角色状态更新等
- `impression_id` 等业务字段在 **请求参数** 中的透传（若后端业务接口需要）

同步时对照 `sync-from-fe` 的「埋点」分类；已有 RN 代码里的埋点上报不在迁移范围内主动补全或对齐 FE。

## 相关 Skill

- 同步逻辑 → `sync-from-fe`
- 平台对照 → `rn-platform-adapters`
- 图片/SVG → `rn-asset-pipeline`
- API/IDL → `rn-api-idl-sync`
- 完成前验证 → `rn-migration-verify`
