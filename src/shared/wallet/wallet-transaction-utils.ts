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

function getWalletTransactionKindLabel(item: WalletTransactionItem, t: TFunction): string {
  const kindKey = `history.kind.${item.kind}`;
  const kindLabel = t(kindKey);
  if (kindLabel !== kindKey) return kindLabel;
  return t('history.kind.unknown');
}

function getWalletTransactionSceneLabel(item: WalletTransactionItem, t: TFunction): string | undefined {
  if (item.scene_name) return item.scene_name;

  if (item.scene) {
    const sceneKey = `history.scene.${item.scene}`;
    const sceneLabel = t(sceneKey);
    if (sceneLabel !== sceneKey) return sceneLabel;
  }

  return undefined;
}

export function getWalletTransactionTitle(item: WalletTransactionItem, t: TFunction): string {
  const kindLabel = getWalletTransactionKindLabel(item, t);
  const sceneLabel = getWalletTransactionSceneLabel(item, t);

  if (sceneLabel) {
    return `${kindLabel} - ${sceneLabel}`;
  }

  return kindLabel;
}

export function getWalletTransactionNote(_item: WalletTransactionItem): string | undefined {
  return undefined;
}

export function formatWalletTransactionAmount(amount: number): string {
  return amount > 0 ? `+${amount}` : String(amount);
}
