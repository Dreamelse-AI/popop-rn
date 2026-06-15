import type { WalletStatusInfo } from '@/generated/arca_apiComponents';
import { isInsufficientBalanceError } from '@/shared/api/api-errors';
import i18n from '@/i18n';

import { openRecharge } from './recharge-store';
import { showGlobalToast } from './toast-store';

export type PaidActionSource =
  | 'me_page'
  | 'story_comment'
  | 'gen_appearance'
  | 'gen_landing_page'
  | 'random_match'
  | 'anonymous_chat_send'
  | 'chat_with_character';

export type RunPaidActionOptions = {
  source: PaidActionSource;
  /** 余额不足（40402）时的场景回滚，如聊天回滚 optimistic 消息 */
  onInsufficientBalance?: () => void;
  /** low_balance 软提醒文案；未传则读 wallet_status.msg 或 i18n 默认 */
  lowBalanceMessage?: string;
};

type WalletStatusWithHint = WalletStatusInfo & { msg?: string };

function extractWalletStatus(result: unknown): WalletStatusWithHint | undefined {
  if (!result || typeof result !== 'object' || !('wallet_status' in result)) {
    return undefined;
  }

  const walletStatus = (result as { wallet_status?: WalletStatusWithHint }).wallet_status;
  if (!walletStatus || typeof walletStatus !== 'object') {
    return undefined;
  }

  return walletStatus;
}

function resolveLowBalanceMessage(
  walletStatus: WalletStatusWithHint,
  override?: string,
): string {
  if (override?.trim()) return override.trim();
  if (walletStatus.msg?.trim()) return walletStatus.msg.trim();
  return i18n.t('wallet.lowBalanceHint');
}

function handleLowBalanceHint(result: unknown, options: RunPaidActionOptions) {
  const walletStatus = extractWalletStatus(result);
  if (!walletStatus?.low_balance) return;

  showGlobalToast(resolveLowBalanceMessage(walletStatus, options.lowBalanceMessage));
}

/**
 * 扣费类用户动作的统一拦截器：
 * - 成功：检查 wallet_status.low_balance → 弹 toast
 * - 40402：弹充值窗 + 执行 onInsufficientBalance → 返回 null
 * - 其他错误：原样抛出
 */
export async function runPaidAction<T>(
  action: () => Promise<T>,
  options: RunPaidActionOptions,
): Promise<T | null> {
  try {
    const result = await action();
    handleLowBalanceHint(result, options);
    return result;
  } catch (error) {
    if (!isInsufficientBalanceError(error)) {
      throw error;
    }

    openRecharge({ source: options.source });
    options.onInsufficientBalance?.();
    return null;
  }
}
