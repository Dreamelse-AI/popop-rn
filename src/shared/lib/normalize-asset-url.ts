/** 修正后端偶发返回的不可达 TOS hostname（RN/H5 共用逻辑） */
export function normalizeTosEndpointHost(endpoint: string): string {
  return endpoint
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/\.ibytepluses\.com$/i, '.bytepluses.com');
}

/** RN 直连 HTTPS；不做 H5 的 /__tos_proxy__ dev 代理 */
export function normalizeAssetUrl(url: string): string {
  if (!url.startsWith('http')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('.ibytepluses.com')) {
      parsed.hostname = parsed.hostname.replace(/\.ibytepluses\.com$/i, '.bytepluses.com');
      return parsed.toString();
    }
  } catch {
    // ignore invalid url
  }

  return url;
}
