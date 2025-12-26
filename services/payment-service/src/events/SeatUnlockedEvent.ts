export interface SeatUnlockedEvent {
  bookingId: string;
  showtimeId: string;
  seatIds: string[];
  reason: string;
}