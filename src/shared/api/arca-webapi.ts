/**
 * goctl 生成客户端的传输适配层：对接 apiClient（Bearer、{ code, msg, data } 信封）。
 * 由 scripts/gen-api.mjs 在 codegen 后写入 src/generated/gocliRequest.ts 再导出。
 */
import { apiClient } from '@/shared/api/api-client';

export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH';

const PATH_PARAM_REG = /:[a-z|A-Z]+/g;

function parsePathParams(url: string): string[] {
  const ps = url.match(PATH_PARAM_REG);
  if (!ps) return [];
  return ps.map(k => k.replace(/:/, ''));
}

/** 将 path 占位符与 query 拼到 URL（与 goctl 默认 gocliRequest 行为一致） */
export function genUrl(url: string, params: Record<string, unknown> | undefined): string {
  if (!params) return url;

  const pathKeys = parsePathParams(url);
  pathKeys.forEach(k => {
    url = url.replace(new RegExp(`:${k}`), String(params[k] ?? ''));
  });

  const query: string[] = [];
  for (const key of Object.keys(params)) {
    if (!pathKeys.includes(key) && params[key] !== undefined) {
      query.push(`${key}=${encodeURIComponent(String(params[key]))}`);
    }
  }

  return query.length > 0 ? `${url}?${query.join('&')}` : url;
}

function isHeaderBag(value: object): boolean {
  return Object.keys(value).some(k => k.includes('-') || /^X-/i.test(k));
}

function mergeObjects(parts: object[]): Record<string, unknown> | undefined {
  if (parts.length === 0) return undefined;
  return Object.assign({}, ...parts);
}

function collectPostArgs(rest: unknown[]): {
  body: Record<string, unknown> | undefined;
  headers: Record<string, string>;
} {
  const headers: Record<string, string> = {};
  const bodyParts: object[] = [];

  for (const part of rest) {
    if (part == null || typeof part === 'string') continue;
    if (typeof part !== 'object') continue;

    if (isHeaderBag(part)) {
      for (const [k, v] of Object.entries(part)) {
        if (v !== undefined && v !== '') headers[k] = String(v);
      }
    } else if (Object.keys(part).length > 0) {
      bodyParts.push(part);
    }
  }

  return { body: mergeObjects(bodyParts), headers };
}

function collectGetParams(rest: unknown[]): Record<string, unknown> | undefined {
  const parts = rest.filter((p): p is object => p != null && typeof p === 'object');
  return mergeObjects(parts);
}

async function call<T>(
  method: Method,
  url: string,
  rest: unknown[],
): Promise<T> {
  const m = method.toLowerCase();

  if (m === 'get' || m === 'delete' || m === 'head' || m === 'options') {
    const params = collectGetParams(rest);
    const fullUrl = genUrl(url, params);
    const httpMethod = m.toUpperCase() as 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS';
    return apiClient.request<T>(fullUrl, { method: httpMethod });
  }

  const { body, headers } = collectPostArgs(rest);
  const httpMethod = m.toUpperCase() as 'POST' | 'PUT' | 'PATCH';
  return apiClient.request<T>(url, {
    method: httpMethod,
    body,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });
}

export const arcaWebapi = {
  get<T>(url: string, ...rest: unknown[]): Promise<T> {
    return call<T>('get', url, rest);
  },
  delete<T>(url: string, ...rest: unknown[]): Promise<T> {
    return call<T>('delete', url, rest);
  },
  put<T>(url: string, ...rest: unknown[]): Promise<T> {
    return call<T>('put', url, rest);
  },
  post<T>(url: string, ...rest: unknown[]): Promise<T> {
    return call<T>('post', url, rest);
  },
  patch<T>(url: string, ...rest: unknown[]): Promise<T> {
    return call<T>('patch', url, rest);
  },
};

export default arcaWebapi;
