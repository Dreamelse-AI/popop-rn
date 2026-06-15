---
name: sync-from-fe
description: Use when syncing changes from popop-fe to popop-rn, or implementing RN features that must match FE behavior.
---

# FE → RN 双仓同步

## 工作流

1. 在 FE 定位源文件（见 `h5-to-rn-migration` 映射表）
2. 计算 RN 目标路径（例：`packages/consumer/src/features/chat/hooks/use-outbound-queue.ts` → `src/features/chat/hooks/use-outbound-queue.ts`）
3. `diff` 两边文件，只合并 **logic 变更**
4. UI 层对照 FE 交互，保持 StyleSheet 实现
5. 必查 RN 改写点（见下表）
6. FE 若改 IDL → 执行 `rn-api-idl-sync`
7. PR 注明 FE commit/PR 引用

## 三分类扫描

| 分类 | 特征 | RN 处理 |
| --- | --- | --- |
| Logic | react/zustand/generated/fetch | 可直接 sync，改 import 为 `@/` |
| Adapter-bound | localStorage、window、File、import.meta | 对照 `src/shared/storage/`、`expo-*` |
| UI-only | Tailwind、DOM、react-router | 只参考交互，RN 重写 |

## RN 改写检查清单

- [ ] `@popop/shared` → `@/shared` 或 `@/generated`
- [ ] `@popop/consumer` → `@/features`
- [ ] `localStorage` → MMKV / SecureStore
- [ ] `useNavigate` → `@react-navigation/native`
- [ ] `className` → `StyleSheet`
- [ ] `<img>` → `PopImage` / `PopIcon`
- [ ] `createPortal` → RN `Modal` / `BottomSheet`
- [ ] `document`/`window` → 删除或 expo 等价 API

## 长期演进

可选抽取 `@popop/core` 消除双份 copy；当前 popop-rn 的 MMKV/OAuth 实现可作为 adapter 参考。

## FE 侧提醒

FE PR 若改 `packages/consumer` 或 `packages/shared` 业务逻辑，应同步 popop-rn 或开 follow-up issue。
