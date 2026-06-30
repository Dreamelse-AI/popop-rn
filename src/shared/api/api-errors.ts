export const API_CODE = {
  /** 聊天用户消息文本安审不通过 */
  CHAT_TEXT_AUDIT_FAILED: 40001,
  /** 聊天用户消息图片安审不通过 */
  CHAT_IMAGE_AUDIT_FAILED: 40002,
  INSUFFICIENT_BALANCE: 40402,
} as const;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class InsufficientBalanceError extends ApiError {
  constructor(message: string) {
    super(API_CODE.INSUFFICIENT_BALANCE, message);
    this.name = 'InsufficientBalanceError';
  }
}

export function isInsufficientBalanceError(error: unknown): error is InsufficientBalanceError {
  return (
    error instanceof InsufficientBalanceError ||
    (error instanceof ApiError && error.status === API_CODE.INSUFFICIENT_BALANCE)
  );
}

/** 聊天内容安审失败（文本 40001 / 图片 40002） */
export function isChatContentAuditError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.status === API_CODE.CHAT_TEXT_AUDIT_FAILED ||
      error.status === API_CODE.CHAT_IMAGE_AUDIT_FAILED)
  );
}
