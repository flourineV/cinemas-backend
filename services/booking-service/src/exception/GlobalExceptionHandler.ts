import type { Request, Response, NextFunction } from 'express';
import { BookingException } from './BookingException.js';
import { BookingNotFoundException } from './BookingNotFoundException.js';
import { SeatAlreadyLockedException } from './SeatAlreadyLockedException.js';

function createBody(status: number, error: string, message: string) {
  return {
    timestamp: new Date().toISOString(),
    status,
    error,
    message,
  };
}

/**
 * Express error-handling middleware.
 * Register this after all routes: app.use(GlobalExceptionHandler);
 */
export function GlobalExceptionHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof SeatAlreadyLockedException) {
    console.warn(`Conflict exception: ${err.message}`);
    return res.status(409).json(createBody(409, 'Resource Conflict', err.message));
  }

  if (err instanceof BookingNotFoundException) {
    console.warn(`Booking not found: ${err.message}`);
    return res.status(404).json(createBody(404, 'Resource Not Found', err.message));
  }

  if (err instanceof BookingException) {
    console.warn(`Business exception: ${err.message}`);
    return res.status(400).json(createBody(400, 'Invalid Request', err.message));
  }

  console.error('Unhandled exception:', err);
  return res
    .status(500)
    .json(
      createBody(
        500,
        'Internal Server Error',
        'An unexpected error occurred. Please try again later.'
      )
    );
}
