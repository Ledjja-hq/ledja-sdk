// LedjaError — typed error class for all SDK errors
export class LedjaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedjaError';
  }
}
