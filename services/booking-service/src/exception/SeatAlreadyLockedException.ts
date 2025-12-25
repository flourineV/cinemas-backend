export class SeatAlreadyLockedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeatAlreadyLockedException';
    Error.captureStackTrace(this, this.constructor);
  }
}
