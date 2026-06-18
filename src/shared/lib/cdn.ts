const CDN_BASE_URL = 'https://cdn-prod-i18n-public.popop.ai/popop-fe';

export function cdnImage(path: string): string {
  return `${CDN_BASE_URL}/${path}`;
}
