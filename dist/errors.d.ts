export declare enum LedjaErrorCode {
    Unauthorized = 1,
    InvalidAmount = 2,
    InvalidDate = 3,
    NotFound = 4,
    AlreadyExists = 5,
    InvalidAddress = 6,
    NetworkError = 7,
    UnknownError = 99
}
export declare class LedjaError extends Error {
    readonly code: LedjaErrorCode;
    constructor(message: string, code: LedjaErrorCode);
}
//# sourceMappingURL=errors.d.ts.map