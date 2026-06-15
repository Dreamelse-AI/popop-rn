# @popop/core 长期演进（可选）

当前 popop-fe 与 popop-rn 采用 **文件级 copy + RN 改写**，未抽取共享 npm 包。

## 短期（当前）

- 用 `sync-from-fe` skill 双仓 diff
- API 用 `npm run gen:api` / `sync:generated-from-fe` 对齐 `src/generated/`

## 长期（可选）

抽取 `@popop/core`：

- 纯 logic：zustand stores、hooks、tos-sign、generated types
- platform interfaces：storage、oauth、file-upload
- H5/RN 各自 adapter 实现

popop-rn 已有参考：`src/shared/storage/`（MMKV）、`src/features/auth/`（原生 OAuth）。

在未抽取 core 前，**不要**在 FE 为 RN 专门拆包，除非双方 PR 同步就绪。
