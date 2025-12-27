export interface SeatUnlockedEvent {
  showtimeId: string; // UUID
  bookingId: string; // UUID
  seatIds: string[]; // UUID[]
  reason: string;
}
