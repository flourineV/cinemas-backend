export interface BookingSeatMappedEvent {
  bookingId: string; // UUID
  showtimeId: string; // UUID
  seatIds: string[]; // UUID[]
  userId: string; // UUID
  guestName: string;
  guestEmail: string;
}
