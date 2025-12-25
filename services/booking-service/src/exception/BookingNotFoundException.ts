export class BookingNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingNotFoundException';
    Error.captureStackTrace(this, this.constructor);
  }
}
