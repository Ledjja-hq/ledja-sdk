"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedjaError = exports.LedjaErrorCode = void 0;
var LedjaErrorCode;
(function (LedjaErrorCode) {
    LedjaErrorCode[LedjaErrorCode["Unauthorized"] = 1] = "Unauthorized";
    LedjaErrorCode[LedjaErrorCode["InvalidAmount"] = 2] = "InvalidAmount";
    LedjaErrorCode[LedjaErrorCode["InvalidDate"] = 3] = "InvalidDate";
    LedjaErrorCode[LedjaErrorCode["NotFound"] = 4] = "NotFound";
    LedjaErrorCode[LedjaErrorCode["AlreadyExists"] = 5] = "AlreadyExists";
    LedjaErrorCode[LedjaErrorCode["InvalidAddress"] = 6] = "InvalidAddress";
    LedjaErrorCode[LedjaErrorCode["NetworkError"] = 7] = "NetworkError";
    LedjaErrorCode[LedjaErrorCode["UnknownError"] = 99] = "UnknownError";
})(LedjaErrorCode || (exports.LedjaErrorCode = LedjaErrorCode = {}));
class LedjaError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'LedjaError';
        this.code = code;
    }
}
exports.LedjaError = LedjaError;
//# sourceMappingURL=errors.js.map