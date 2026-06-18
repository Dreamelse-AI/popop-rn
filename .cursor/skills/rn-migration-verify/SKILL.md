---
name: rn-migration-verify
description: Use before marking a popop-rn feature complete. Mock-first parity checklist.
---

# 迁移验证 Checklist

完成 feature 或同步 PR 前逐项确认：

## 功能

- [ ] Mock 模式可离线演示核心流程（若模块有 mock 开关）
- [ ] generated 类型与 API 路径与 FE 一致
- [ ] 登录态恢复 / 401 登出正常
- [ ] 深链 / 分享（若适用）

## 质量

- [ ] `npm run typecheck` 通过
- [ ] 全屏 overlay / 二级页的 `PageHeaderBar` safe area 与挂载层级一致（rule `rn-top-nav-spacing`）
- [ ] 无未处理 rejection / 无多余 `console.error`
- [ ] 核心路径手测记录

## 资产

- [ ] Tab/icon 在 2x/3x 清晰、选中态正确
- [ ] 远程图慢网有 placeholder，列表无错图闪烁
- [ ] 上传走 presigned PUT（若涉及）

## Mock-first

沿用 FE 策略：新 API 先 mock，类型对齐 `src/generated`，再切真实后端。

完整模板见 `reference/checklist.md`。
