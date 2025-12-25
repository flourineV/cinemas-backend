export interface BookingCreatedEvent {
  bookingId: string; // UUID
  userId: string; // UUID
  guestName: string;
  guestEmail: string;
  showtimeId: string; // UUID
  seatIds: string[]; // UUID[]
  totalPrice: string; // numeric as string
}
