export const API_CODE = {
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
