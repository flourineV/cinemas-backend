export interface BookingStatusUpdatedEvent {
  bookingId: string; // UUID
  showtimeId: string; // UUID
  seatIds: string[]; // UUID[]
  newStatus: string;
  previousStatus: string;
}
