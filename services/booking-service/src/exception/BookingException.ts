export class BookingException extends Error {
  constructor(message: string, options?: { cause?: Error }) {
    super(message);
    this.name = 'BookingException';
    if (options?.cause) {
      (this as any).cause = options.cause;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}
