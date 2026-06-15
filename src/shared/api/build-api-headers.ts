import { buildLocaleHeaders } from '@/shared/api/locale-headers';
import { buildRequestSignHeaders } from '@/shared/api/request-sign';

export type BuildApiHeadersOptions = {
  token?: string | null;
  method?: string;
  path?: string;
  bodyString?: string;
  headers?: Record<string, string>;
  contentType?: string | false;
};

export async function buildApiHeaders(
  options: BuildApiHeadersOptions = {},
): Promise<Record<string, string>> {
  const {
    token = null,
    method = 'POST',
    path = '',
    bodyString = '',
    headers = {},
    contentType = 'application/json',
  } = options;

  const reqHeaders: Record<string, string> = {
    ...(contentType ? { 'Content-Type': contentType } : {}),
    ...headers,
  };

  if (token) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  Object.assign(reqHeaders, buildLocaleHeaders());

  if (path) {
    Object.assign(reqHeaders, await buildRequestSignHeaders(method, path, bodyString));
  }

  return reqHeaders;
}
