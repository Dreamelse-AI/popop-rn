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
npm run dev              # dev client port 8082
npm run typecheck
npx expo prebuild --clean   # native 依赖变更后
eas build --profile development --platform ios
```

## 禁止事项

- 禁止假设仓库名 popop-native 或使用 Expo Router
- 禁止 RN import `@popop/consumer` / `@popop/shared`
- 禁止引入 `react-dom`、`react-router`、Tailwind、`localStorage`
- 禁止手改 `src/generated/`
- 禁止从 FE 整文件复制 `.tsx` 而不做 RN 改写
- 禁止跳过 Mock 开关联调未验证 API

## 相关 Skill

- 同步逻辑 → `sync-from-fe`
- 平台对照 → `rn-platform-adapters`
- 图片/SVG → `rn-asset-pipeline`
- API/IDL → `rn-api-idl-sync`
- 完成前验证 → `rn-migration-verify`
