---
name: rn-api-idl-sync
description: Use when updating API types, syncing common-idl, or running gen:api in popop-rn.
---

# API / IDL 同步

## 标准流程

```bash
cd /Users/allen/Fork/popop-rn
git submodule update --init external/common-idl
npm run idl:update      # 拉最新 dev
npm run gen:api         # 需要 goctl
npm run typecheck
```

## 提交清单

- [ ] `external/common-idl` submodule 指针
- [ ] `src/generated/*` 生成物
- [ ] 业务代码适配 breaking change

## 禁止

- **禁止** 手改 `src/generated/arca_api*.ts`

## gen:api 后必做

generated 更新后，按 FE 同步业务层（`sync-from-fe`），至少检查：

- `src/features/character-creation/`
- `src/features/chat/hooks/use-chat-preference.ts`
- `src/features/chat/api/chat-preference-api.mock.ts`

## 临时方案（deprecated）

goctl 未安装时：

```bash
npm run sync:generated-from-fe
```

从 `../popop-fe/packages/shared/src/generated` 复制并替换 import 路径。

## 文档

详见 `docs/api-idl-workflow.md`；FE 侧见 `popop-fe/docs/api-idl-workflow.md`。
