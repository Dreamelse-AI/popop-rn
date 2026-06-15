const inflightRequests = new Map<string, Promise<unknown>>();

/** 合并同一 key 的并发请求，避免 StrictMode 等场景重复打接口 */
export function dedupeRequest<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = factory().finally(() => {
    if (inflightRequests.get(key) === promise) {
      inflightRequests.delete(key);
    }
  });

  inflightRequests.set(key, promise);
  return promise;
}
