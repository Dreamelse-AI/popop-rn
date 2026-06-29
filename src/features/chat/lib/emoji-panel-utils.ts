import type { EmojiItem, EmojiPack, ListEmojiPanelResp } from '@/generated/arca_apiComponents';

export type EmojiPanelTab = {
  kind: 'pack'
  id: string
  label: string
  coverUrl?: string
  pack: EmojiPack
}

export function flattenEmojiPanel(panel: ListEmojiPanelResp): EmojiItem[] {
  const seen = new Set<string>();
  const result: EmojiItem[] = [];

  const add = (items: EmojiItem[] | undefined) => {
    for (const item of items ?? []) {
      if (seen.has(item.emoji_id)) continue;
      seen.add(item.emoji_id);
      result.push(item);
    }
  };

  add(panel.recent);
  add(panel.my_emojis);
  for (const pack of panel.packs ?? []) {
    add(pack.emojis);
  }

  return result;
}

export function buildEmojiPanelTabs(panel: ListEmojiPanelResp): EmojiPanelTab[] {
  const tabs: EmojiPanelTab[] = [];

  for (const pack of panel.packs ?? []) {
    if ((pack.emojis?.length ?? 0) === 0) continue;
    tabs.push({
      kind: 'pack',
      id: pack.pack_id,
      label: pack.name,
      coverUrl: pack.cover?.url,
      pack,
    });
  }

  return tabs;
}

export function resolveEmojiPanelTabEmojis(tab: EmojiPanelTab): EmojiItem[] {
  return tab.pack.emojis ?? [];
}

export function isEmojiPanelEmpty(panel: ListEmojiPanelResp): boolean {
  return flattenEmojiPanel(panel).length === 0;
}
