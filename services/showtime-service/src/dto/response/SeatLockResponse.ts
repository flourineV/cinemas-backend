export interface SeatLockResponse {
  showtimeId: string;
  seatId: string;
  status: string; // LOCKED / AVAILABLE / ALREADY_LOCKED
  ttl: number;    // seconds until expiration
}