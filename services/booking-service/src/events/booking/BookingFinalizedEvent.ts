export interface BookingFinalizedEvent {
  bookingId: string; // UUID
  userId: string; // UUID
  showtimeId: string; // UUID
  finalPrice: string; // numeric as string
}
