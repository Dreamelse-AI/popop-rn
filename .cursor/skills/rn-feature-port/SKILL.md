---
name: rn-feature-port
description: Use when porting or verifying a feature module between popop-fe and popop-rn. Chat is the reference implementation.
---

# Feature 模块迁移/验证

## 工作流

1. 读 FE spec（如 `popop-fe/docs/mobile-chat-development.md`）
2. Inventory：列出 FE ↔ RN 路径（`sync-from-fe`）
3. Sync logic：合并 hooks/store/api
4. Verify UI：StyleSheet 交互 parity
5. 注册 navigation（`src/app/navigation.tsx`）
6. 跑 `rn-migration-verify` checklist

## Chat 参考结构（已迁移，80+ 文件）

```
src/features/chat/
├── api/           # chat-api + mock
├── hooks/         # use-outbound-queue, use-message-polling...
├── store/         # chat-session-store
├── lib/           # adapters, schedulers
├── ui/            # screens, input, message list
└── config/        # chat-config.ts
```

## 待迁移模块示例

| FE | RN 状态 |
| --- | --- |
| `features/resource/` | 已补 music-picker |
| `apps/pc/` | 不迁移 |

## 新 feature 目录约定

- 业务逻辑 → `src/features/<name>/`
- 页面壳 → `src/pages/<name>/`
- 共享 UI → `src/shared/ui/`

详见 `reference/chat-port-map.md`。
