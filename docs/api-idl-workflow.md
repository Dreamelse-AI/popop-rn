# API IDL Workflow (popop-rn)

接口契约来自 `external/common-idl` submodule（与 [popop-fe](https://github.com/Dreamelse-AI/popop-fe) 同源）：

```text
external/common-idl/arca/api/arca.api
```

`src/generated/` 是基于当前 submodule commit 生成的 TypeScript 客户端，**提交到本仓库**。

## 首次初始化

```bash
cd /Users/allen/Fork/popop-rn
git submodule update --init --recursive
npm install
npm run gen:api
```

若 submodule clone 失败，可先初始化完整 submodule 仓库（不要只复制单个 `arca.api` 文件）：

```bash
git submodule update --init external/common-idl
```

仅在无法访问远程仓库的极端情况下，可临时从 popop-fe 复制整个 `external/common-idl` 目录后再 `pnpm gen:api`。

**重要**：`gen:api` 更新 generated 后，须用 `sync-from-fe` 同步对应业务代码（character-creation、chat-preference 等），否则 `npm run typecheck` 会失败。

需要本机安装 [goctl](https://go-zero.dev/docs/tasks/installation/goctl-install)（与 popop-fe 相同）。

## 更新 IDL 并重新生成

```bash
npm run idl:update
npm run gen:api
npm run typecheck
```

提交时需同时包含：

- `external/common-idl` submodule 指针变更
- `src/generated/*` 生成物变更
- 必要的业务代码适配

## 从 popop-fe 快速同步（临时）

goctl 未就绪或需与 FE 对齐时：

```bash
npm run sync:generated-from-fe
```

此命令为 **deprecated 临时方案**；IDL 变更应优先走 submodule + `gen:api`。

## 切分支后 submodule diff

与 popop-fe 相同：`git checkout` 后若出现 `modified: external/common-idl`，执行：

```bash
git submodule update --init external/common-idl
```
