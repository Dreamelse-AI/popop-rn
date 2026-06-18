/** 登录成功后的统一副作用处理：写入 token / 登录态，并在新用户时标记待展示奖励弹窗 */
import { apiClient } from '@/shared/api/api-client';
import { refreshWallet } from '@/shared/wallet/wallet-store';

import { useAuthStore } from './auth-store';
// import type 仅导入类型，编译后会被擦除，不会引入实际的代码
import type { AuthResponse } from './auth-types';
import { markUserRegisteredAt } from '@/features/feed/lib/feed-user-context';

import { setPendingNewUserReward } from './new-user-reward';
import { env } from '@/shared/env';

// 获取新用户奖励金币数量（从后端 reward_tokens 读取）
export function getNewUserRewardCoins(res: AuthResponse): number {
  const coins = res.reward_tokens;
  if (!coins) {
    console.error('[auth] reward_tokens not found in login response');
    return 0;
  }
  return coins;
}

function withDevNewUserMock(res: AuthResponse): AuthResponse {
  if (__DEV__ && env.mockNewUser) {
    return { ...res, is_new: true };
  }
  return res;
}

/** 仅写入 apiClient token，不更新全局登录态（避免自设提交未完成时被路由守卫踢到首页） */
export function applyAuthTokenOnly(res: AuthResponse) {
  apiClient.setToken(withDevNewUserMock(res).jwt_token);
}

/** 自设提交失败且尚未正式登录时，清除临时 token */
export function clearPendingAuthToken() {
  if (!useAuthStore.getState().token) {
    apiClient.setToken(null);
  }
}

// 写入 token / 登录态，并在新用户时标记待展示奖励弹窗
// 参数 res 是已通过 authApi 解析后的业务数据（不是原始 envelope）
export function applyAuthResponse(res: AuthResponse) {
  // 先走 DEV Mock 包装，得到最终用于副作用的 auth 对象。生产环境通常 auth === res
  const auth = withDevNewUserMock(res);
  // 将 jwt 写入 apiClient 内存。从这一行起，同一会话内后续 API 请求都会带 Bearer
  // 注意：登出时要记得 apiClient.setToken(null)；本文件只负责登录写入
  apiClient.setToken(auth.jwt_token);
  // 调用 zustand store 的 login 方法，更新全局登录态
  useAuthStore.getState().login(auth.jwt_token, auth.expires_in);

  if (auth.is_new) {
    markUserRegisteredAt();
    setPendingNewUserReward(getNewUserRewardCoins(auth));
  }

  void refreshWallet();
}
