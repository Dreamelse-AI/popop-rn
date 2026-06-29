import { Linking } from 'react-native';

/** 打开聊天中的 HTML 链接卡片（外部 http(s) 链接交由系统处理） */
export function openChatLink(url: string): void {
  const trimmed = url.trim();
  if (!trimmed) return;
  void Linking.openURL(trimmed).catch(() => {
    // 无法打开（无匹配应用/非法 scheme）时静默忽略
  });
}
