const sessionClearListeners = new Set<() => void>();

/** 供各用户数据 store 注册登出 / 游客模式时的清理逻辑 */
export function registerSessionClearListener(listener: () => void) {
  sessionClearListeners.add(listener);
  return () => sessionClearListeners.delete(listener);
}

/** 登出 / 游客模式时清空用户相关内存缓存 */
export function clearUserSessionStores() {
  sessionClearListeners.forEach(listener => listener());
}
