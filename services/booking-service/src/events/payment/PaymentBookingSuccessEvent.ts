export interface PaymentBookingSuccessEvent {
  paymentId: string; // UUID
  bookingId: string; // UUID
  showtimeId: string; // UUID
  userId: string; // UUID
  amount: string; // numeric as string
  method: string;
  seatIds: string[]; // UUID[]
  message: string;
}
