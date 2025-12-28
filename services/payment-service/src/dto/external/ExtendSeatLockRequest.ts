export interface ExtendSeatLockRequest {
  showtimeId: string;
  seatIds: string[];
  userId?: string;
  guestSessionId?: string;
}