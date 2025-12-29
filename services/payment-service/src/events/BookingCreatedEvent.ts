export interface BookingCreatedEvent {
  bookingId: string;
  userId: string;
  // guestName: string;
  // guestEmail: string;
  showtimeId: string;
  seatIds: string[];
  totalPrice: string; // BigNumber -> string
}