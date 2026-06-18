# CDN 图片资源管理规范

## 架构说明

| CDN 路径 | 管理仓库 | 用途 |
|---|---|---|
| `popop-fe/assets/...` | **popop-rn** | Web Mobile + RN 共用图片 |
| `popop-fe/pc/assets/...` | **popop-fe** | Web PC 独有图片 |

CDN 域名：`https://cdn-prod-i18n-public.popop.ai`

完整 URL 示例：`https://cdn-prod-i18n-public.popop.ai/popop-fe/assets/auth/check.svg`

---

## 初始配置（新成员必读）

clone 仓库后，执行以下步骤：

```bash
cd scripts/cdn
cp config.example.mjs config.mjs
```

打开 `config.mjs`，把 `accessKeyId` 和 `accessKeySecret` 替换为管理员提供的真实 AccessKey。

> `config.mjs` 已在 `.gitignore` 中，不会被提交到 git。请勿分享或上传此文件。

---

## 日常开发流程

### 场景 1：新增共享图片（Mobile / RN 共用）

1. 在 **popop-rn** 仓库的 `src/shared/assets/` 对应子目录放入图片
2. `git push` → pre-push hook 自动压缩 + 上传 CDN
3. **RN 代码** 中使用：
   - PNG/JPG：`{ uri: cdnImage('assets/子目录/文件名.png') }`
   - SVG（作为组件）：`import XxxIcon from '@/shared/assets/子目录/xxx.svg'`
4. **Web 代码** 中使用：`cdnImage('assets/子目录/文件名')` — 不需要在 Web 仓库存图片

### 场景 2：新增 PC 独有图片

1. 在 **popop-fe** 仓库的 `apps/pc/public/assets/` 放入图片
2. `git push` → pre-push hook 自动压缩 + 上传 CDN
3. 代码中使用：`cdnImage('pc/assets/文件名')`

### 场景 3：修改/替换已有图片

1. 在对应仓库用新文件替换旧文件（保持文件名不变）
2. `git push` → 脚本检测到文件变化，自动重新压缩并覆盖上传

---

## 代码中引用图片

两个仓库都提供了 `cdnImage()` 工具函数：

```typescript
import { cdnImage } from '@/shared/lib/cdn';  // RN
import { cdnImage } from '@popop/shared/shared/lib/cdn';  // Web

// 共享图片（RN 管理）
const avatar = cdnImage('assets/auth/avatar-placeholder.svg');

// PC 独有图片（Web 管理）
const navLogo = cdnImage('pc/assets/nav-logo.svg');
```

---

## 目录结构

### popop-rn

```
src/shared/assets/          ← 共享图片源（唯一管理方）
├── auth/
├── character/
├── dialog/
├── feed/
├── main/
├── me/
└── random-match/

scripts/
├── compress-assets.mjs     ← 图片压缩脚本
└── cdn/
    ├── config.example.mjs  ← 配置模板（提交到 git）
    ├── config.mjs          ← 真实配置（.gitignore）
    ├── upload.mjs          ← 上传脚本
    ├── sync.mjs            ← 自动化入口
    └── upload-manifest.json← 哈希记录（.gitignore）
```

### popop-fe

```
apps/pc/public/assets/      ← PC 独有图片

scripts/cdn/
├── config.example.mjs
├── config.mjs              ← （.gitignore）
├── compress.mjs
├── upload.mjs
├── sync.mjs
└── upload-manifest.json    ← （.gitignore）
```

---

## 重要规则

1. **共享图片只在 popop-rn 仓库管理**，Web 仓库不存共享图片副本
2. Web 开发者需要新的共享图片 → 先在 popop-rn 加好并 push，然后 Web 直接用 `cdnImage('assets/...')` 引用
3. 图片路径必须和 `src/shared/assets/` 下的目录结构一致
4. 不要上传未使用的图片，删除图片时同步从本地和 CDN 清理
5. `config.mjs` 含 AccessKey，绝对不要提交到 git

---

## 手动操作命令

```bash
# 手动执行压缩 + 上传
pnpm cdn:sync

# 仅压缩（不上传）
pnpm compress:assets        # RN
node scripts/cdn/compress.mjs  # Web
```
