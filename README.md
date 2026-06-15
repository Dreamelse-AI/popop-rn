# Popop RN

Popop 的 React Native 移动端应用，对标 popop-fe 的 mobile 端功能。

## 环境要求

- **Node.js**: >= 20.x（推荐 20.20+）
- **npm**: >= 10.x
- **Xcode**: >= 16.0（iOS 开发）
- **CocoaPods**: >= 1.15
- **iOS Deployment Target**: 16.4+
- **Android SDK**: compileSdk 35, targetSdk 35

## 技术栈

| 依赖 | 版本 |
|------|------|
| Expo | ~56.0.11 |
| React Native | 0.85.3 |
| React | 19.2.3 |
| TypeScript | ~6.0.3 |

## 快速启动

```bash
# 安装依赖
npm install

# 生成 native 工程（首次或依赖变更后）
npx expo prebuild --clean

# iOS - 安装 CocoaPods
cd ios && pod install && cd ..

# 启动 Metro Bundler
npx expo start

# iOS 模拟器运行（需要先 build）
xcodebuild -workspace ios/Popop.xcworkspace -scheme Popop -sdk iphonesimulator -configuration Debug build
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/Popop.app
xcrun simctl launch booted com.popop.app

# 或使用 Xcode 直接运行
open ios/Popop.xcworkspace
```

## 常用命令

```bash
# 类型检查
npm run typecheck

# API 生成（需 goctl + submodule）
git submodule update --init external/common-idl
npm run gen:api

# 从 popop-fe 快速同步 generated（临时）
npm run sync:generated-from-fe

# IDL 更新
npm run idl:update && npm run gen:api

# 清除 Metro 缓存
npx expo start --clear

# 重新生成 native 工程
npx expo prebuild --clean

# iOS pod 重装
cd ios && pod install --repo-update && cd ..
```

## 项目结构

```
src/
├── app/                    # 应用入口、导航配置、screen wrappers
├── features/               # 业务功能模块
│   ├── auth/               # 登录认证
│   ├── character/           # 角色（详情、搜索、添加）
│   ├── character-creation/  # 角色创建（AI图片、草稿、发布）
│   ├── chat/               # 聊天（消息、语音、emoji、氛围）
│   ├── comment/            # 评论
│   ├── feed/               # 信息流（推荐、story、搜索）
│   ├── friendship/         # 好友关系
│   ├── post/               # 帖子/动态查看
│   ├── post-dynamic/       # 动态发布
│   ├── share/              # 分享
│   ├── story/              # Story 查看器
│   └── user-persona/       # 用户人设
├── generated/              # API 生成代码（勿手动修改）
├── pages/                  # 页面组件
│   ├── auth/               # 登录页
│   ├── character/          # 角色相关页面
│   ├── character-creation/ # 角色创建页面
│   ├── chat/               # 聊天页
│   ├── home/               # 首页（feed、messages、me、create）
│   ├── random-match/       # 随机匹配
│   └── splash/             # 启动屏
├── shared/                 # 共享基础设施
│   ├── api/                # API client、签名、headers
│   ├── assets/             # 图标、图片等静态资源
│   ├── hooks/              # 通用 hooks
│   ├── lib/                # 工具函数
│   ├── storage/            # 持久化存储（MMKV）
│   ├── session-store/      # 内存 session 存储
│   ├── ui/                 # 通用 UI 组件
│   └── wallet/             # 钱包/充值/支付
└── i18n/                   # 国际化
```

## 注意事项

### 开发调试

- **本地自动登录**: 复制 `.env.example` 为 `.env.local`，把 `DEV_AUTH_TOKEN=xxx` 里的 `xxx` 换成真实 JWT。仅 `__DEV__` 生效，token 永不过期；改 env 后需重启 Metro。
- **Network Inspector**: `ios/Podfile.properties.json` 中 `EX_DEV_CLIENT_NETWORK_INSPECTOR` 设为 `false`，设为 `true` 会导致 TLS 连接问题
- **ATS**: Info.plist 中 `NSAllowsArbitraryLoads` 设为 `true`（开发环境），生产环境需改回 `false`
- **Metro 缓存**: 如果修改了 native 代码或配置文件后出现异常，尝试 `npx expo start --clear`

### 待配置项（PENDING-ISSUES）

以下功能需要配置密钥后才能正常使用，详见 `ai-analysis/PENDING-ISSUES.md`：

1. **Google 登录**: 需要 iOS 类型的 OAuth Client ID（当前使用的是 Web 类型）
2. **Apple 登录**: 需要真机 + Apple Developer 配置 Sign In with Apple capability
3. **Stripe 支付**: 需要 Stripe publishable key

### 与 FE 工程的映射关系

本项目对标 `popop-fe` monorepo 中的 mobile 端：

| FE 路径 | RN 路径 |
|---------|---------|
| `apps/mobile/src/pages/` | `src/pages/` |
| `packages/consumer/src/features/` | `src/features/` |
| `packages/shared/src/features/` | `src/features/` |
| `packages/shared/src/shared/` | `src/shared/` |

PC 端代码（`apps/pc/`）不迁移。

### 构建配置

- **Bundle ID**: `com.popop.app`
- **Scheme**: `popop`
- **API Base URL**: `https://i18n-api.imaginewithu.com`（可通过环境变量 `API_BASE_URL` 覆盖）
