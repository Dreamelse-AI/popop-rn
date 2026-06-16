import type { TFunction } from 'i18next';

import type { WalletTransactionItem } from '@/generated/arca_apiComponents';
import { toEpochMs } from '@/shared/lib/epoch-ms';

export function formatWalletTransactionDate(timestamp: number, locale: string): string {
  const date = new Date(toEpochMs(timestamp));
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getWalletTransactionTitle(item: WalletTransactionItem, t: TFunction): string {
  if (item.kind === 'consume' && item.scene) {
    const sceneKey = `history.scene.${item.scene}`;
    const sceneLabel = t(sceneKey);
    if (sceneLabel !== sceneKey) return sceneLabel;
  }

  const kindKey = `history.kind.${item.kind}`;
  const kindLabel = t(kindKey);
  if (kindLabel !== kindKey) return kindLabel;

  return t('history.kind.unknown');
}

export function getWalletTransactionNote(item: WalletTransactionItem, t: TFunction): string | undefined {
  if (item.kind === 'refund') {
    return t('history.note.refund');
  }
  return undefined;
}

export function formatWalletTransactionAmount(amount: number): string {
  return amount > 0 ? `+${amount}` : String(amount);
}
