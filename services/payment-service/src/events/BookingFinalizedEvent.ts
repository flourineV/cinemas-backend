export interface BookingFinalizedEvent {
  bookingId: string;
  userId: string;
  showtimeId: string;
  finalPrice: string; //bigNumber -> string
}