/**
 * 站外分享渠道：按当前语言映射到不同 app
 *
 * - 仅收录 web 端可通过公开 URL 直接跳转分享的 app（微信/朋友圈/KakaoTalk 无公开分享 URL，不收录）。
 * - 图标用 simple-icons 的官方 logo path（单色），配色用各品牌主色 hex。
 * - 「复制链接」由 ShareSheet 单独渲染，不在此列表中。
 */
import { siX, siWhatsapp, siTelegram, siFacebook, siLine, siSinaweibo, siQq, siThreads, siInstagram, siKakaotalk } from 'simple-icons';

import { buildShareUrl, type ShareContent } from './share-types';

export type ShareChannelId = 'x' | 'whatsapp' | 'telegram' | 'facebook' | 'line' | 'weibo' | 'qq' | 'imessage' | 'threads' | 'instagram' | 'kakaotalk';

type SimpleIcon = { title: string; hex: string; path: string };

export type ShareChannel = {
  id: ShareChannelId;
  label: string;
  /** 品牌主色（#RRGGBB），用作图标底色 */
  hex: string;
  /** simple-icons 的 SVG path data */
  iconPath: string;
  /** 根据分享内容构建该渠道的分享跳转 URL */
  buildUrl: (content: ShareContent) => string;
};

/** 各语言展示的渠道顺序 */
const CHANNELS_BY_LANG: Record<string, ShareChannelId[]> = {
  en: ['imessage', 'x', 'threads', 'instagram', 'whatsapp', 'telegram'],
  ja: ['imessage', 'x', 'threads', 'instagram', 'line'],
  ko: ['imessage', 'x', 'threads', 'instagram', 'kakaotalk', 'line'],
  zh: ['weibo', 'qq'],
};

function shareText(content: ShareContent): string {
  if (content.kind === 'character') {
    return `来看看 ${content.characterName} 的角色主页`;
  }
  return content.content || `${content.characterName} 的动态`;
}

const IMESSAGE_PATH = 'M4.5 2A4.5 4.5 0 0 0 0 6.5v7A4.5 4.5 0 0 0 4.5 18h1.7l-1 3.3a.5.5 0 0 0 .8.5L10.4 18H19.5a4.5 4.5 0 0 0 4.5-4.5v-7A4.5 4.5 0 0 0 19.5 2h-15Z';

const CHANNELS: Record<ShareChannelId, ShareChannel> = {
  imessage: customChannel('imessage', 'iMessage', '#34C759', IMESSAGE_PATH, content => {
    const u = buildShareUrl(content);
    return `sms:&body=${enc(`${shareText(content)} ${u}`)}`;
  }),
  x: channel('x', siX, content => {
    const u = buildShareUrl(content);
    return `https://twitter.com/intent/tweet?text=${enc(shareText(content))}&url=${enc(u)}`;
  }),
  threads: channel('threads', siThreads, content => {
    const u = buildShareUrl(content);
    return `https://www.threads.net/intent/post?text=${enc(`${shareText(content)} ${u}`)}`;
  }),
  instagram: channel('instagram', siInstagram, content => {
    const u = buildShareUrl(content);
    return `https://www.instagram.com/?url=${enc(u)}`;
  }),
  kakaotalk: channel('kakaotalk', siKakaotalk, content => {
    const u = buildShareUrl(content);
    return `https://story.kakao.com/share?url=${enc(u)}&text=${enc(shareText(content))}`;
  }),
  whatsapp: channel('whatsapp', siWhatsapp, content => {
    const u = buildShareUrl(content);
    return `https://wa.me/?text=${enc(`${shareText(content)} ${u}`)}`;
  }),
  telegram: channel('telegram', siTelegram, content => {
    const u = buildShareUrl(content);
    return `https://t.me/share/url?url=${enc(u)}&text=${enc(shareText(content))}`;
  }),
  facebook: channel('facebook', siFacebook, content => {
    const u = buildShareUrl(content);
    return `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}`;
  }),
  line: channel('line', siLine, content => {
    const u = buildShareUrl(content);
    return `https://line.me/R/share?text=${enc(`${shareText(content)} ${u}`)}`;
  }),
  weibo: channel('weibo', siSinaweibo, content => {
    const u = buildShareUrl(content);
    return `https://service.weibo.com/share/share.php?url=${enc(u)}&title=${enc(shareText(content))}`;
  }),
  qq: channel('qq', siQq, content => {
    const u = buildShareUrl(content);
    return `https://connect.qq.com/widget/shareqq/index.html?url=${enc(u)}&title=${enc(shareText(content))}`;
  }),
};

function channel(
  id: ShareChannelId,
  icon: SimpleIcon,
  buildUrl: (content: ShareContent) => string,
): ShareChannel {
  return { id, label: icon.title, hex: `#${icon.hex}`, iconPath: icon.path, buildUrl };
}

function customChannel(
  id: ShareChannelId,
  label: string,
  hex: string,
  iconPath: string,
  buildUrl: (content: ShareContent) => string,
): ShareChannel {
  return { id, label, hex, iconPath, buildUrl };
}

function enc(s: string): string {
  return encodeURIComponent(s);
}

/** 取当前语言要展示的分享渠道列表（语言不在表中时回退 en） */
export function getShareChannels(lang: string): ShareChannel[] {
  const key = (lang.split('-')[0] ?? '').toLowerCase();
  const ids = CHANNELS_BY_LANG[key] ?? CHANNELS_BY_LANG.en!;
  return ids.map(id => CHANNELS[id]);
}
