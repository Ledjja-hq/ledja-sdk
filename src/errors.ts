export enum LedjaErrorCode {
  Unauthorized = 1,
  InvalidAmount = 2,
  InvalidDate = 3,
  NotFound = 4,
  AlreadyExists = 5,
  InvalidAddress = 6,
  NetworkError = 7,
  UnknownError = 99,
}

export class LedjaError extends Error {
  public readonly code: LedjaErrorCode;

  constructor(message: string, code: LedjaErrorCode) {
    super(message);
    this.name = 'LedjaError';
    this.code = code;
  }
}
